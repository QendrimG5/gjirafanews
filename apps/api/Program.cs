using Amazon;
using Amazon.S3;
using FluentValidation;
using GjirafaNewsAPI.Caching;
using GjirafaNewsAPI.Hubs;
using GjirafaNewsAPI.Infrastructure;
using GjirafaNewsAPI.Infrastructure.Data;
using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Infrastructure.Messaging;
using GjirafaNewsAPI.Infrastructure.Persistence.Interceptors;
using GjirafaNewsAPI.Infrastructure.Storage;
//using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Repositories;
using GjirafaNewsAPI.Services;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Serilog;
using Serilog.Sinks.Grafana.Loki;
using StackExchange.Redis;
using System.Security.Claims;
using System.Text.Json;

namespace GjirafaNewsAPI
{
    public class Program
    {
        private const string AdminWebCorsPolicy = "AdminWebCors";

        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            var lokiUrl = builder.Configuration["Loki:Url"] ?? "http://loki:3100";

            builder.Host.UseSerilog((ctx, _, cfg) => cfg
                .ReadFrom.Configuration(ctx.Configuration)
                .Enrich.FromLogContext()
                .Enrich.WithProperty("app", "gjirafanewsapi")
                .WriteTo.Console()
                .WriteTo.GrafanaLoki(
                    lokiUrl,
                    labels: new[] { new LokiLabel { Key = "app", Value = "gjirafanewsapi" } }));

            builder.Services.AddControllers(options =>
            {
                options.Filters.Add<FluentValidationFilter>();
            });
            builder.Services.AddOpenApi();
            builder.Services.AddSignalR();
            builder.Services.AddSingleton<OnlineCounter>();
            builder.Services.AddSingleton<IDashboardService, DashboardService>();
            builder.Services.AddHostedService<DashboardBackgroundService>();
            builder.Services.AddScoped<INotificationStore, NotificationStore>();
            builder.Services.AddScoped<INotificationService, NotificationService>();

            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required");

            // Interceptors must be singletons, registered BEFORE DbContext
            builder.Services.AddSingleton<AuditTimestampInterceptor>();
            builder.Services.AddSingleton<SoftDeleteInterceptor>();

            builder.Services.AddDbContext<AppDbContext>((sp, options) => options
                .UseNpgsql(connectionString)
                .UseSnakeCaseNamingConvention()
                //.UseLazyLoadingProxies()
                .AddInterceptors(
                    sp.GetRequiredService<AuditTimestampInterceptor>(),
                    sp.GetRequiredService<SoftDeleteInterceptor>()));

            builder.Services.AddNpgsqlDataSource(connectionString);  // for Dapper
            builder.Services.AddScoped<IArticleRepository, ArticleRepository>();
            builder.Services.AddScoped<DapperArticleRepository>();
            builder.Services.AddSingleton<IUserRepository, InMemoryUserRepository>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddValidatorsFromAssemblyContaining<Program>();

            builder.Services.Configure<CacheOptions>(builder.Configuration.GetSection("Cache"));
            var redisConnectionString = builder.Configuration.GetConnectionString("Redis")
                ?? throw new InvalidOperationException("ConnectionStrings:Redis is required");
            builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
                ConnectionMultiplexer.Connect(redisConnectionString));
            builder.Services.AddScoped<IRedisService, RedisService>();

            ConfigureS3Storage(builder);
            ConfigureEmail(builder);
            ConfigureHangfire(builder, connectionString);
            ConfigureKafka(builder);
            ConfigureKeycloakAuth(builder);
            ConfigureCors(builder);

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.MigrateAsync();
                await DatabaseSeeder.SeedAsync(db);
            }

            app.UseMiddleware<ExceptionHandlingMiddleware>();

            app.UseSerilogRequestLogging();

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
                app.UseSwaggerUI(options =>
                {
                    options.SwaggerEndpoint("/openapi/v1.json", "GjirafaNewsAPI v1");
                    options.RoutePrefix = "swagger";
                });
            }
            else
            {
                app.UseHttpsRedirection();
            }

            app.UseCors(AdminWebCorsPolicy);
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.MapHub<NotificationsHub>(NotificationsHub.Path);
            app.MapHub<ChatHub>(ChatHub.Path);
            app.MapHub<DashboardHub>(DashboardHub.Path);

            // Hangfire dashboard. Open in dev; gate with an
            // IDashboardAuthorizationFilter before going to prod.
            app.UseHangfireDashboard("/hangfire", new DashboardOptions
            {
                DashboardTitle = "GjirafaNews Jobs",
                Authorization = Array.Empty<Hangfire.Dashboard.IDashboardAuthorizationFilter>(),
            });

            ConfigureRecurringJobs(app.Services);

            await app.RunAsync();
        }

        private static void ConfigureS3Storage(WebApplicationBuilder builder)
        {
            builder.Services.Configure<S3Options>(builder.Configuration.GetSection("S3"));

            builder.Services.AddSingleton<IAmazonS3>(sp =>
            {
                var opts = sp.GetRequiredService<IOptions<S3Options>>().Value;
                var config = new AmazonS3Config
                {
                    ForcePathStyle = opts.ForcePathStyle,
                };
                // For S3-compatible endpoints (MinIO, CDN77, LocalStack) the
                // region label isn't an AWS region — pass it as the SigV4
                // signing scope via AuthenticationRegion instead of trying to
                // resolve it as a RegionEndpoint.
                if (!string.IsNullOrWhiteSpace(opts.ServiceUrl))
                {
                    config.ServiceURL = opts.ServiceUrl;
                    if (!string.IsNullOrWhiteSpace(opts.Region))
                    {
                        config.AuthenticationRegion = opts.Region;
                    }
                }
                else if (!string.IsNullOrWhiteSpace(opts.Region))
                {
                    config.RegionEndpoint = RegionEndpoint.GetBySystemName(opts.Region);
                }
                return new AmazonS3Client(config);
            });

            builder.Services.AddScoped<IStorageService, S3StorageService>();
        }

        private static void ConfigureEmail(WebApplicationBuilder builder)
        {
            builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Email"));
            builder.Services.AddScoped<IEmailService, MailKitEmailService>();
        }

        private static void ConfigureKafka(WebApplicationBuilder builder)
        {
            builder.Services.Configure<KafkaOptions>(builder.Configuration.GetSection("Kafka"));

            // Producer is thread-safe and pools connections internally — keep
            // a single instance for the lifetime of the process.
            builder.Services.AddSingleton<IKafkaProducer, KafkaProducer>();

            // Shared in-memory ring buffer between the consumer worker and the
            // controller's GET endpoint.
            builder.Services.AddSingleton(sp =>
            {
                var opts = sp.GetRequiredService<IOptions<KafkaOptions>>().Value;
                return new MessageLog(opts.RecentBufferSize);
            });

            builder.Services.AddHostedService<KafkaConsumerWorker>();
        }

        private static void ConfigureRecurringJobs(IServiceProvider services)
        {
            var recurring = services.GetRequiredService<IRecurringJobManager>();

            // Every 3 minutes: persist a notification row and push it to all
            // connected SignalR clients. INotificationService.BroadcastAsync
            // handles both the AppDbContext insert and the hub broadcast.
            recurring.AddOrUpdate<INotificationService>(
                "scheduled-notification",
                svc => svc.BroadcastAsync(
                    "Njoftim periodik",
                    "Mesazh i planifikuar nga Hangfire.",
                    "scheduled",
                    default),
                "*/3 * * * *");
        }

        private static void ConfigureHangfire(WebApplicationBuilder builder, string connectionString)
        {
            // Hangfire's PostgreSQL storage uses prepared statements that don't
            // play nice with PgBouncer transaction pooling, so it gets the same
            // direct-Postgres connection that EF migrations use.
            var hangfireConnection = builder.Configuration.GetConnectionString("Hangfire")
                ?? connectionString;

            builder.Services.AddHangfire(cfg => cfg
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UsePostgreSqlStorage(opts => opts.UseNpgsqlConnection(hangfireConnection)));

            builder.Services.AddHangfireServer(opts =>
            {
                opts.WorkerCount = Math.Max(2, Environment.ProcessorCount);
            });
        }

        private static void ConfigureKeycloakAuth(WebApplicationBuilder builder)
        {
            var keycloakSection = builder.Configuration.GetSection("Keycloak");
            var authority = keycloakSection["Authority"]
                ?? throw new InvalidOperationException("Keycloak:Authority is required");
            var audience = keycloakSection["Audience"] ?? "gjirafanews-api";
            var requireHttps = keycloakSection.GetValue<bool>("RequireHttpsMetadata");

            builder.Services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.Authority = authority;
                    options.Audience = audience;
                    options.RequireHttpsMetadata = requireHttps;
                    options.TokenValidationParameters.NameClaimType = "preferred_username";
                    options.TokenValidationParameters.RoleClaimType = ClaimTypes.Role;
                    options.Events = new JwtBearerEvents
                    {
                        OnTokenValidated = FlattenKeycloakRealmRoles,
                        // SignalR's WebSocket and ServerSentEvents transports cannot
                        // attach Authorization headers, so the JS client passes the
                        // access token in the `access_token` query string instead.
                        OnMessageReceived = ctx =>
                        {
                            var accessToken = ctx.Request.Query["access_token"];
                            var path = ctx.HttpContext.Request.Path;
                            if (!string.IsNullOrEmpty(accessToken) &&
                                (path.StartsWithSegments(NotificationsHub.Path) ||
                                 path.StartsWithSegments(ChatHub.Path) ||
                                 path.StartsWithSegments(DashboardHub.Path)))
                            {
                                ctx.Token = accessToken;
                            }
                            return Task.CompletedTask;
                        }
                    };
                });

            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
            });
        }

        // Keycloak embeds realm roles under the "realm_access" JSON claim
        // ({ "roles": ["admin", "user"] }). ASP.NET's role system expects flat
        // role claims, so copy each entry into ClaimTypes.Role during validation.
        private static Task FlattenKeycloakRealmRoles(TokenValidatedContext context)
        {
            if (context.Principal?.Identity is not ClaimsIdentity identity)
                return Task.CompletedTask;

            var realmAccess = identity.FindFirst("realm_access")?.Value;
            if (string.IsNullOrEmpty(realmAccess))
                return Task.CompletedTask;

            using var doc = JsonDocument.Parse(realmAccess);
            if (!doc.RootElement.TryGetProperty("roles", out var roles) ||
                roles.ValueKind != JsonValueKind.Array)
            {
                return Task.CompletedTask;
            }

            foreach (var role in roles.EnumerateArray())
            {
                var roleName = role.GetString();
                if (!string.IsNullOrEmpty(roleName))
                {
                    identity.AddClaim(new Claim(ClaimTypes.Role, roleName));
                }
            }

            return Task.CompletedTask;
        }

        private static void ConfigureCors(WebApplicationBuilder builder)
        {
            var origins = (builder.Configuration["Cors:AllowedOrigins"]
                    ?? "http://localhost:3000,http://localhost:3002")
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            builder.Services.AddCors(options =>
            {
                options.AddPolicy(AdminWebCorsPolicy, policy => policy
                    .WithOrigins(origins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    // SignalR with bearer auth requires credentials to be allowed
                    // so the negotiate request can carry the cookie/token correctly.
                    .AllowCredentials());
            });
        }
    }
}

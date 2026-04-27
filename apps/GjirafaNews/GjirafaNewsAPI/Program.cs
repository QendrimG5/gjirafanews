using System.Security.Claims;
using System.Text.Json;
using FluentValidation;
using GjirafaNewsAPI.Infrastructure;
using GjirafaNewsAPI.Infrastructure.Data;
using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Infrastructure.Persistence.Interceptors;

//using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Repositories;
using GjirafaNewsAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Serilog;
using Serilog.Sinks.Grafana.Loki;

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

            await app.RunAsync();
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
                        OnTokenValidated = FlattenKeycloakRealmRoles
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
            var adminWebOrigin = builder.Configuration["Cors:AdminWebOrigin"] ?? "http://localhost:3002";

            builder.Services.AddCors(options =>
            {
                options.AddPolicy(AdminWebCorsPolicy, policy => policy
                    .WithOrigins(adminWebOrigin)
                    .AllowAnyHeader()
                    .AllowAnyMethod());
            });
        }
    }
}

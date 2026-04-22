using FluentValidation;
using GjirafaNewsAPI.Infrastructure;
using GjirafaNewsAPI.Repositories;
using GjirafaNewsAPI.Services;
using Serilog;
using Serilog.Sinks.Grafana.Loki;

namespace GjirafaNewsAPI
{
    public class Program
    {
        public static void Main(string[] args)
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

            // Add services to the container.

            builder.Services.AddControllers(options =>
            {
                options.Filters.Add<FluentValidationFilter>();
            });
            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddOpenApi();

            builder.Services.AddSingleton<IUserRepository, InMemoryUserRepository>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddValidatorsFromAssemblyContaining<Program>();

            var app = builder.Build();

            app.UseMiddleware<ExceptionHandlingMiddleware>();

            app.UseSerilogRequestLogging();

            // Configure the HTTP request pipeline.
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

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}

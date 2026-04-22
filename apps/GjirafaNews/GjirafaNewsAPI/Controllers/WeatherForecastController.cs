using Microsoft.AspNetCore.Mvc;

namespace GjirafaNewsAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastController(ILogger<WeatherForecastController> logger) : ControllerBase
    {
        private static readonly string[] Summaries =
        [
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        ];

        [HttpGet(Name = "GetWeatherForecast")]
        public IEnumerable<WeatherForecast> Get()
        {
            var requestId = Guid.NewGuid();
            logger.LogInformation("WeatherForecast requested {RequestId}", requestId);

            var forecasts = Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                TemperatureC = Random.Shared.Next(-20, 55),
                Summary = Summaries[Random.Shared.Next(Summaries.Length)]
            })
            .ToArray();

            logger.LogInformation(
                "WeatherForecast returned {Count} items {RequestId} summaries={Summaries}",
                forecasts.Length,
                requestId,
                forecasts.Select(f => f.Summary).ToArray());

            return forecasts;
        }
    }
}

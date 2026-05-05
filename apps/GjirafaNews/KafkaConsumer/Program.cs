using Confluent.Kafka;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GjirafaNews.KafkaConsumer;

public static class Program
{
    public static async Task Main(string[] args)
    {
        var host = Host.CreateApplicationBuilder(args);
        host.Logging.AddSimpleConsole(o =>
        {
            o.SingleLine = true;
            o.TimestampFormat = "HH:mm:ss ";
        });
        host.Services.Configure<ConsumerSettings>(host.Configuration.GetSection("Kafka"));
        host.Services.AddHostedService<ConsumeWorker>();
        await host.Build().RunAsync();
    }
}

public sealed class ConsumerSettings
{
    public string BootstrapServers { get; set; } = "kafka:9092";
    public string Topic { get; set; } = "messages.demo";
    public string ConsumerGroup { get; set; } = "gjirafanews-console";
    public string ClientId { get; set; } = "gjirafanews-console-consumer";
}

public sealed class ConsumeWorker(
    Microsoft.Extensions.Options.IOptions<ConsumerSettings> options,
    ILogger<ConsumeWorker> logger) : BackgroundService
{
    private readonly ConsumerSettings _settings = options.Value;

    // The Kafka client uses a blocking poll, so park it on a dedicated thread
    // instead of letting it tie up a thread-pool worker.
    protected override Task ExecuteAsync(CancellationToken stoppingToken) =>
        Task.Run(() => Consume(stoppingToken), stoppingToken);

    private void Consume(CancellationToken stoppingToken)
    {
        var config = new ConsumerConfig
        {
            BootstrapServers = _settings.BootstrapServers,
            // Distinct group from the API so this consumer sees a full copy
            // of every message (parallel subscribers, not load-balanced).
            GroupId = _settings.ConsumerGroup,
            ClientId = _settings.ClientId,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = true,
        };

        using var consumer = new ConsumerBuilder<string?, string>(config)
            .SetErrorHandler((_, e) =>
                logger.Log(
                    e.IsFatal ? LogLevel.Error : LogLevel.Warning,
                    "kafka error: {Reason}", e.Reason))
            .Build();

        consumer.Subscribe(_settings.Topic);
        logger.LogInformation(
            "Subscribed to {Topic} on {Servers} (group {Group})",
            _settings.Topic, _settings.BootstrapServers, _settings.ConsumerGroup);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var result = consumer.Consume(stoppingToken);
                    if (result?.Message is null) continue;

                    logger.LogInformation(
                        "[p{Partition} o{Offset}] key={Key} value={Value}",
                        result.Partition.Value,
                        result.Offset.Value,
                        result.Message.Key ?? "<null>",
                        result.Message.Value);
                }
                catch (ConsumeException ex)
                {
                    logger.LogWarning(ex, "Consume error: {Reason}", ex.Error.Reason);
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Expected on shutdown.
        }
        finally
        {
            consumer.Close();
        }
    }
}

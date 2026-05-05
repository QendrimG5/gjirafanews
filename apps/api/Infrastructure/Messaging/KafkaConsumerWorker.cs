using Confluent.Kafka;
using Microsoft.Extensions.Options;

namespace GjirafaNewsAPI.Infrastructure.Messaging;

// Subscribes to KafkaOptions.Topic and feeds each consumed message into the
// shared MessageLog. Runs on its own thread so Consume's blocking poll doesn't
// occupy a thread-pool worker.
public class KafkaConsumerWorker(
    IOptions<KafkaOptions> options,
    MessageLog log,
    ILogger<KafkaConsumerWorker> logger) : BackgroundService
{
    private readonly KafkaOptions _options = options.Value;

    protected override Task ExecuteAsync(CancellationToken stoppingToken) =>
        Task.Run(() => RunConsumeLoop(stoppingToken), stoppingToken);

    private void RunConsumeLoop(CancellationToken stoppingToken)
    {
        var config = new ConsumerConfig
        {
            BootstrapServers = _options.BootstrapServers,
            GroupId = _options.ConsumerGroup,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = true,
            ClientId = "gjirafanews-api-consumer",
        };

        using var consumer = new ConsumerBuilder<string?, string>(config)
            .SetErrorHandler((_, e) =>
                logger.Log(
                    e.IsFatal ? LogLevel.Error : LogLevel.Warning,
                    "kafka consumer error: {Reason}",
                    e.Reason))
            .Build();

        consumer.Subscribe(_options.Topic);
        logger.LogInformation(
            "Kafka consumer subscribed to {Topic} on {Servers} (group {Group})",
            _options.Topic, _options.BootstrapServers, _options.ConsumerGroup);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var result = consumer.Consume(stoppingToken);
                    if (result?.Message is null) continue;

                    log.Add(new ConsumedMessage(
                        result.Topic,
                        result.Partition.Value,
                        result.Offset.Value,
                        result.Message.Key,
                        result.Message.Value,
                        DateTime.UtcNow));

                    logger.LogInformation(
                        "Consumed from {Topic} [p{Partition} o{Offset}] key={Key}",
                        result.Topic, result.Partition.Value, result.Offset.Value,
                        result.Message.Key);
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

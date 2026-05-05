using Confluent.Kafka;
using Microsoft.Extensions.Options;

namespace GjirafaNewsAPI.Infrastructure.Messaging;

// IProducer is internally thread-safe and the rdkafka docs explicitly recommend
// reusing a single instance per process — registering as a singleton avoids
// reconnecting + re-fetching metadata on every publish.
public sealed class KafkaProducer : IKafkaProducer, IDisposable
{
    private readonly IProducer<string?, string> _producer;
    private readonly ILogger<KafkaProducer> _logger;

    public KafkaProducer(IOptions<KafkaOptions> options, ILogger<KafkaProducer> logger)
    {
        _logger = logger;
        var config = new ProducerConfig
        {
            BootstrapServers = options.Value.BootstrapServers,
            Acks = Acks.All,
            EnableIdempotence = true,
            ClientId = "gjirafanews-api",
            LingerMs = 5,
        };
        _producer = new ProducerBuilder<string?, string>(config)
            .SetLogHandler((_, m) => _logger.LogDebug("kafka: {Message}", m.Message))
            .SetErrorHandler((_, e) =>
                _logger.Log(
                    e.IsFatal ? LogLevel.Error : LogLevel.Warning,
                    "kafka error: {Reason}",
                    e.Reason))
            .Build();
    }

    public async Task<(int Partition, long Offset)> PublishAsync(
        string topic, string? key, string value, CancellationToken ct = default)
    {
        var result = await _producer.ProduceAsync(
            topic,
            new Message<string?, string> { Key = key, Value = value },
            ct);

        _logger.LogInformation(
            "Produced to {Topic} [partition {Partition} offset {Offset}]",
            topic, result.Partition.Value, result.Offset.Value);

        return (result.Partition.Value, result.Offset.Value);
    }

    public void Dispose()
    {
        // Ensure outstanding messages are delivered before shutdown.
        _producer.Flush(TimeSpan.FromSeconds(5));
        _producer.Dispose();
    }
}

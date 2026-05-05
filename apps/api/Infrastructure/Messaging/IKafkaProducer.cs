namespace GjirafaNewsAPI.Infrastructure.Messaging;

public interface IKafkaProducer
{
    // Publishes value to topic with optional key. Returns the partition+offset
    // assigned by the broker once the leader has acknowledged.
    Task<(int Partition, long Offset)> PublishAsync(
        string topic,
        string? key,
        string value,
        CancellationToken ct = default);
}

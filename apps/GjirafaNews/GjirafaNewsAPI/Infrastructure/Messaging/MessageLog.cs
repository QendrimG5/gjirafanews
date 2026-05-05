using System.Collections.Concurrent;

namespace GjirafaNewsAPI.Infrastructure.Messaging;

public record ConsumedMessage(
    string Topic,
    int Partition,
    long Offset,
    string? Key,
    string Value,
    DateTime ConsumedAt);

// In-memory ring buffer of the most-recent N consumed messages. Singleton so
// the consumer worker writes and the controller reads from the same instance.
public sealed class MessageLog(int capacity)
{
    private readonly ConcurrentQueue<ConsumedMessage> _items = new();
    private readonly int _capacity = capacity;
    private readonly Lock _lock = new();

    public void Add(ConsumedMessage message)
    {
        _items.Enqueue(message);
        // Trim under a lock so concurrent enqueuers can't drive size below 0.
        lock (_lock)
        {
            while (_items.Count > _capacity && _items.TryDequeue(out _))
            {
            }
        }
    }

    public IReadOnlyList<ConsumedMessage> Snapshot() => _items.ToArray();
}

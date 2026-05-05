namespace GjirafaNewsAPI.Services;

// Process-local online connection counts per hub. Singleton — registered before
// the hubs that increment it. Replace with Redis (INCR/DECR per key) if we ever
// scale out beyond a single API instance.
public class OnlineCounter
{
    private int _notifications;
    private int _chat;

    public int Notifications => Volatile.Read(ref _notifications);
    public int Chat => Volatile.Read(ref _chat);

    public int IncrementNotifications() => Interlocked.Increment(ref _notifications);
    public int DecrementNotifications() => DecrementClamped(ref _notifications);

    public int IncrementChat() => Interlocked.Increment(ref _chat);
    public int DecrementChat() => DecrementClamped(ref _chat);

    private static int DecrementClamped(ref int field)
    {
        var n = Interlocked.Decrement(ref field);
        if (n < 0)
        {
            // Should never happen, but if it does we recover instead of drifting forever.
            Interlocked.Exchange(ref field, 0);
            return 0;
        }
        return n;
    }
}

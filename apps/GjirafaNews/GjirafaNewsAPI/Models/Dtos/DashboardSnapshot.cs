namespace GjirafaNewsAPI.Models.Dtos;

public record DashboardSnapshot(
    int RealtimeUsers,
    int ChatUsers,
    int ArticlesCount,
    int NotificationsCount,
    int ChatMessagesCount,
    DashboardLatest? LatestNotification,
    DashboardLatestArticle? LatestArticle,
    DateTime GeneratedAt);

public record DashboardLatest(string Title, DateTime CreatedAt);

public record DashboardLatestArticle(int Id, string Title, DateTime PublishedAt);

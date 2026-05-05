namespace GjirafaNewsAPI.Models.Dtos;

public record SendEmailRequest(string To, string Subject, string Body);

public record ScheduleEmailRequest(string To, string Subject, string Body, int DelaySeconds);

public record ScheduleEmailResponse(string JobId, DateTime EnqueuedAt, DateTime RunAt);

namespace GjirafaNewsAPI.Services;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string body, CancellationToken ct = default);
}

public class EmailOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 25;
    public string From { get; set; } = "noreply@gjirafanews.local";
    public string FromName { get; set; } = "GjirafaNews";
    public string? Username { get; set; }
    public string? Password { get; set; }

    // None | Auto | StartTls | SslOnConnect — Papercut wants None.
    public string SecureSocketOptions { get; set; } = "None";

    // Treat the body as HTML (true) or plain text (false).
    public bool Html { get; set; } = true;
}

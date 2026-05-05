using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace GjirafaNewsAPI.Services;

public class MailKitEmailService(
    IOptions<EmailOptions> options,
    ILogger<MailKitEmailService> logger) : IEmailService
{
    private readonly EmailOptions _options = options.Value;

    public async Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.From));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart(_options.Html ? "html" : "plain") { Text = body };

        var secure = ParseSecureSocketOptions(_options.SecureSocketOptions);

        using var client = new SmtpClient();
        await client.ConnectAsync(_options.Host, _options.Port, secure, ct);

        if (!string.IsNullOrEmpty(_options.Username))
        {
            await client.AuthenticateAsync(_options.Username, _options.Password, ct);
        }

        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);

        logger.LogInformation(
            "Sent email to {To} via {Host}:{Port}", to, _options.Host, _options.Port);
    }

    private static SecureSocketOptions ParseSecureSocketOptions(string value) =>
        Enum.TryParse<SecureSocketOptions>(value, ignoreCase: true, out var parsed)
            ? parsed
            : SecureSocketOptions.None;
}

using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Services;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GjirafaNewsAPI.Controllers;

[ApiController]
[Route("api/emails")]
[AllowAnonymous]
public class EmailsController(
    IEmailService email,
    IBackgroundJobClient jobs) : ControllerBase
{
    // POST /api/emails/send — sends synchronously.
    [HttpPost("send")]
    public async Task<IActionResult> Send(
        [FromBody] SendEmailRequest request,
        CancellationToken ct)
    {
        await email.SendAsync(request.To, request.Subject, request.Body, ct);
        return NoContent();
    }

    // POST /api/emails/schedule — enqueues via Hangfire to run after a delay.
    [HttpPost("schedule")]
    public ActionResult<ScheduleEmailResponse> Schedule(
        [FromBody] ScheduleEmailRequest request)
    {
        var enqueuedAt = DateTime.UtcNow;
        var runAt = enqueuedAt.AddSeconds(request.DelaySeconds);

        // Hangfire serializes the call expression — `IEmailService` is resolved
        // from DI by the worker at execution time. The CancellationToken
        // argument is replaced by Hangfire's own shutdown token.
        var jobId = jobs.Schedule<IEmailService>(
            svc => svc.SendAsync(request.To, request.Subject, request.Body, default),
            TimeSpan.FromSeconds(request.DelaySeconds));

        return Ok(new ScheduleEmailResponse(jobId, enqueuedAt, runAt));
    }
}

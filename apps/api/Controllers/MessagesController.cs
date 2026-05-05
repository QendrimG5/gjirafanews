using GjirafaNewsAPI.Infrastructure.Messaging;
using GjirafaNewsAPI.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace GjirafaNewsAPI.Controllers;

[ApiController]
[Route("api/messages")]
[AllowAnonymous]
public class MessagesController(
    IKafkaProducer producer,
    MessageLog log,
    IOptions<KafkaOptions> options) : ControllerBase
{
    // POST /api/messages — produces { key, value } to KafkaOptions.Topic.
    [HttpPost]
    public async Task<ActionResult<PublishMessageResponse>> Publish(
        [FromBody] PublishMessageRequest request,
        CancellationToken ct)
    {
        var topic = options.Value.Topic;
        var (partition, offset) = await producer.PublishAsync(topic, request.Key, request.Value, ct);
        return Ok(new PublishMessageResponse(topic, partition, offset));
    }

    // GET /api/messages — returns the in-process consumer's recent buffer
    // (newest last). Useful to verify the round-trip without external tools.
    [HttpGet]
    public ActionResult<IReadOnlyList<ConsumedMessageDto>> Recent()
    {
        var snapshot = log.Snapshot()
            .Select(m => new ConsumedMessageDto(
                m.Topic, m.Partition, m.Offset, m.Key, m.Value, m.ConsumedAt))
            .ToList();
        return Ok(snapshot);
    }
}

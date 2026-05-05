namespace GjirafaNewsAPI.Models.Dtos;

public record PublishMessageRequest(string? Key, string Value);

public record PublishMessageResponse(string Topic, int Partition, long Offset);

public record ConsumedMessageDto(
    string Topic,
    int Partition,
    long Offset,
    string? Key,
    string Value,
    DateTime ConsumedAt);

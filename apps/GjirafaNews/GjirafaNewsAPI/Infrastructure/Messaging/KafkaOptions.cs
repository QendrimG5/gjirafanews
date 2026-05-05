namespace GjirafaNewsAPI.Infrastructure.Messaging;

public class KafkaOptions
{
    public string BootstrapServers { get; set; } = "kafka:9092";
    public string Topic { get; set; } = "messages.demo";
    public string ConsumerGroup { get; set; } = "gjirafanews-api";
    public int RecentBufferSize { get; set; } = 100;
}

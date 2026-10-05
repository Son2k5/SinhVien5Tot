using System.Threading.Channels;
using SV5T.Application.Notifications;

namespace SV5T.Infrastructure.Notifications;

internal sealed class NotificationQueue : INotificationQueue
{
    private readonly Channel<NotificationJob> channel = Channel.CreateBounded<NotificationJob>(
        new BoundedChannelOptions(10_000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false,
            AllowSynchronousContinuations = false
        });

    public bool TryEnqueue(NotificationJob job)
    {
        try
        {
            return channel.Writer.TryWrite(job);
        }
        catch
        {
            return false;
        }
    }

    public IAsyncEnumerable<NotificationJob> ReadAllAsync(CancellationToken cancellationToken) =>
        channel.Reader.ReadAllAsync(cancellationToken);
}

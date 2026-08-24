using MailKit.Security;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MimeKit;
using SV5T.Application.Common.Models;
using SV5T.Infrastructure.Email;
using SV5T.Infrastructure.Options;
using Xunit;

namespace SV5T.UnitTests.Infrastructure.Email;

public sealed class SmtpEmailSenderTests
{
    [Fact]
    public async Task SendAsync_ReusesConnectionAcrossMessages()
    {
        await using var smtpClient = new FakeSmtpClient();
        var sender = CreateSender(smtpClient);

        await sender.SendAsync(
            new EmailMessage(
                "first@example.com",
                "First",
                "<p>First body</p>"));
        await sender.SendAsync(
            new EmailMessage(
                "second@example.com",
                "Second",
                "<p>Second body</p>"));

        Assert.Equal(1, smtpClient.ConnectCallCount);
        Assert.Equal(1, smtpClient.AuthenticateCallCount);
        Assert.Equal(2, smtpClient.SendCallCount);
        Assert.Equal(SecureSocketOptions.StartTls, smtpClient.SocketOptions);
    }

    [Fact]
    public async Task SendAsync_ReusesOneConnectionForBurstOfThreeHundredMessages()
    {
        await using var smtpClient = new FakeSmtpClient();
        var sender = CreateSender(smtpClient);

        for (var index = 0; index < 300; index++)
        {
            await sender.SendAsync(
                new EmailMessage(
                    $"student{index}@ms.hanu.edu.vn",
                    "OTP verification",
                    $"<strong>{index:D6}</strong>"));
        }

        Assert.Equal(1, smtpClient.ConnectCallCount);
        Assert.Equal(1, smtpClient.AuthenticateCallCount);
        Assert.Equal(300, smtpClient.SendCallCount);
    }

    [Fact]
    public async Task SendAsync_BuildsHtmlMimeMessage()
    {
        await using var smtpClient = new FakeSmtpClient();
        var sender = CreateSender(smtpClient);

        await sender.SendAsync(
            new EmailMessage(
                "student@example.com",
                "OTP verification",
                "<strong>123456</strong>"));

        var sent = Assert.Single(smtpClient.Messages);
        Assert.Equal("SV5T Test", sent.From.Mailboxes.Single().Name);
        Assert.Equal("no-reply@example.com", sent.From.Mailboxes.Single().Address);
        Assert.Equal("student@example.com", sent.To.Mailboxes.Single().Address);
        Assert.Equal("OTP verification", sent.Subject);
        Assert.Contains("123456", sent.HtmlBody);
    }

    private static SmtpEmailSender CreateSender(ISmtpClient smtpClient)
    {
        var options = Options.Create(
            new EmailSettings
            {
                SmtpHost = "smtp-relay.brevo.com",
                SmtpPort = 587,
                Username = "no-reply@example.com",
                Password = "app-password",
                FromName = "SV5T Test",
                FromAddress = "no-reply@example.com",
                StartTls = true
            });

        return new SmtpEmailSender(
            smtpClient,
            options,
            NullLogger<SmtpEmailSender>.Instance);
    }

    // This fake demonstrates the mockable seam; a mocking framework can mock
    // ISmtpClient without ever opening a network connection.
    private sealed class FakeSmtpClient : ISmtpClient
    {
        public bool IsConnected { get; private set; }

        public bool IsAuthenticated { get; private set; }

        public int ConnectCallCount { get; private set; }

        public int AuthenticateCallCount { get; private set; }

        public int SendCallCount { get; private set; }

        public SecureSocketOptions? SocketOptions { get; private set; }

        public List<MimeMessage> Messages { get; } = [];

        public Task ConnectAsync(
            string host,
            int port,
            SecureSocketOptions options,
            CancellationToken cancellationToken = default)
        {
            ConnectCallCount++;
            SocketOptions = options;
            IsConnected = true;
            return Task.CompletedTask;
        }

        public Task AuthenticateAsync(
            string username,
            string password,
            CancellationToken cancellationToken = default)
        {
            AuthenticateCallCount++;
            IsAuthenticated = true;
            return Task.CompletedTask;
        }

        public Task<string> SendAsync(
            MimeMessage message,
            CancellationToken cancellationToken = default)
        {
            SendCallCount++;
            Messages.Add(message);
            return Task.FromResult("queued");
        }

        public Task DisconnectAsync(
            bool quit,
            CancellationToken cancellationToken = default)
        {
            IsConnected = false;
            IsAuthenticated = false;
            return Task.CompletedTask;
        }

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}



namespace SV5T.Application.Common.Models;

public sealed record EmailMessage(
    string To,
    string Subject,
    string Body,
    string? TemplateKey = null);

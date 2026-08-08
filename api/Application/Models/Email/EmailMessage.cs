namespace SV5T.Application.Models.Email;

public sealed record EmailMessage(
    string To,
    string Subject,
    string Body,
    string? TemplateKey = null);

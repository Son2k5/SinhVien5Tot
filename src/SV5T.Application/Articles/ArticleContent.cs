using System.Text.Json;
using FluentValidation;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Application.Articles;

public sealed record ArticleBlockDto(
    string Type,
    int? Level = null,
    string? Text = null,
    IReadOnlyList<string>? Items = null,
    Guid? ImageId = null,
    string? Alt = null,
    string? Caption = null);

public static class ArticleContent
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static string Serialize(IReadOnlyList<ArticleBlockDto> blocks) =>
        JsonSerializer.Serialize(blocks, JsonOptions);

    public static IReadOnlyList<ArticleBlockDto> Deserialize(string contentJson)
    {
        try
        {
            return JsonSerializer.Deserialize<List<ArticleBlockDto>>(contentJson, JsonOptions) ?? [];
        }
        catch (JsonException exception)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Nội dung bài viết không hợp lệ.",
                "invalid_article_content",
                exception);
        }
    }

    public static IReadOnlySet<Guid> ExtractImageIds(IEnumerable<ArticleBlockDto> blocks) =>
        blocks.Where(x => x.Type == "Image" && x.ImageId.HasValue)
            .Select(x => x.ImageId!.Value)
            .ToHashSet();

    public static string DeriveExcerpt(IEnumerable<ArticleBlockDto> blocks)
    {
        var paragraph = blocks.FirstOrDefault(x =>
            x.Type == "Paragraph" && !string.IsNullOrWhiteSpace(x.Text))?.Text?.Trim();
        if (string.IsNullOrEmpty(paragraph) || paragraph.Length <= 300)
            return paragraph ?? string.Empty;

        var candidate = paragraph[..300];
        var lastWhitespace = candidate.LastIndexOfAny([' ', '\t', '\r', '\n']);
        return (lastWhitespace > 0 ? candidate[..lastWhitespace] : candidate).TrimEnd();
    }

    public static void EnsurePublishable(IReadOnlyList<ArticleBlockDto> blocks)
    {
        if (!blocks.Any(HasContent))
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Bài viết phải có ít nhất một khối nội dung trước khi đăng.",
                "article_content_required");
    }

    private static bool HasContent(ArticleBlockDto block) => block.Type switch
    {
        "Heading" or "Paragraph" or "Quote" => !string.IsNullOrWhiteSpace(block.Text),
        "List" => block.Items?.Any(x => !string.IsNullOrWhiteSpace(x)) == true,
        "Image" => block.ImageId.HasValue,
        _ => false
    };
}

public sealed class ArticleBlocksValidator : AbstractValidator<IReadOnlyList<ArticleBlockDto>>
{
    private static readonly HashSet<string> AllowedTypes =
        ["Heading", "Paragraph", "Image", "Quote", "List"];

    public ArticleBlocksValidator()
    {
        RuleFor(x => x.Count).LessThanOrEqualTo(200)
            .WithMessage("Nội dung bài viết không được vượt quá 200 khối.");
        RuleFor(x => x).Must(x => x.Count(b => b.Type == "Image") <= 30)
            .WithMessage("Một bài viết chỉ được chứa tối đa 30 ảnh.");
        RuleFor(x => x).Must(x => TotalCharacters(x) <= 100_000)
            .WithMessage("Nội dung bài viết không được vượt quá 100.000 ký tự.");
        RuleFor(x => x).Must(x => !ContainsControlCharacters(x))
            .WithMessage("Nội dung bài viết chứa ký tự điều khiển không hợp lệ.");

        RuleForEach(x => x).ChildRules(block =>
        {
            block.RuleFor(x => x.Type).Must(AllowedTypes.Contains)
                .WithMessage("Loại khối nội dung không hợp lệ.");
            block.RuleFor(x => x.Level)
                .Must((item, level) => item.Type == "Heading" ? level is 2 or 3 : level is null)
                .WithMessage("Level chỉ được dùng cho Heading và phải là 2 hoặc 3.");
            block.RuleFor(x => x.Text)
                .Must((item, text) => item.Type switch
                {
                    "Heading" => !string.IsNullOrWhiteSpace(text) && text.Length <= 200,
                    "Paragraph" or "Quote" => text is not null && text.Length <= 5_000,
                    _ => text is null
                })
                .WithMessage("Text không đúng schema hoặc vượt quá giới hạn của loại khối.");
            block.RuleFor(x => x.Items)
                .Must((item, items) => item.Type == "List"
                    ? items is { Count: <= 50 } && items.All(x => x is not null && x.Length <= 500)
                    : items is null)
                .WithMessage("Items chỉ dùng cho List, tối đa 50 mục và 500 ký tự mỗi mục.");
            block.RuleFor(x => x.ImageId)
                .Must((item, imageId) => item.Type == "Image" ? imageId.HasValue : imageId is null)
                .WithMessage("ImageId là bắt buộc cho khối Image và không được dùng cho loại khác.");
            block.RuleFor(x => x.Alt).MaximumLength(200)
                .Must((item, alt) => item.Type == "Image" || alt is null)
                .WithMessage("Alt chỉ được dùng cho khối Image và tối đa 200 ký tự.");
            block.RuleFor(x => x.Caption).MaximumLength(300)
                .Must((item, caption) => item.Type == "Image" || caption is null)
                .WithMessage("Caption chỉ được dùng cho khối Image và tối đa 300 ký tự.");
        });
    }

    private static int TotalCharacters(IEnumerable<ArticleBlockDto> blocks) =>
        blocks.Sum(x =>
            (x.Text?.Length ?? 0) +
            (x.Alt?.Length ?? 0) +
            (x.Caption?.Length ?? 0) +
            (x.Items?.Sum(item => item?.Length ?? 0) ?? 0));

    private static bool ContainsControlCharacters(IEnumerable<ArticleBlockDto> blocks) =>
        blocks.SelectMany(StringValues).Any(value => value.Any(IsRejectedControl));

    private static IEnumerable<string> StringValues(ArticleBlockDto block)
    {
        yield return block.Type;
        if (block.Text is not null) yield return block.Text;
        if (block.Alt is not null) yield return block.Alt;
        if (block.Caption is not null) yield return block.Caption;
        if (block.Items is not null)
            foreach (var item in block.Items)
                if (item is not null) yield return item;
    }

    private static bool IsRejectedControl(char value) =>
        char.IsControl(value) && value is not ('\r' or '\n' or '\t');
}

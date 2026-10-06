using SV5T.Domain.Users;

namespace SV5T.Domain.Articles;

public enum ArticleStatus
{
    Draft = 1,
    Published = 2,
    Archived = 3
}

public enum ArticleCategory
{
    News = 1,
    Announcement = 2,
    Event = 3
}

public sealed class Article : AggregateRoot<Guid>
{
    public Article()
    {
        Id = Guid.NewGuid();
    }

    public string Title { get; private set; } = string.Empty;
    public string Excerpt { get; private set; } = string.Empty;
    public string ContentJson { get; private set; } = "[]";
    public ArticleCategory Category { get; private set; }
    public ArticleStatus Status { get; private set; } = ArticleStatus.Draft;
    public bool IsPinned { get; private set; }
    public Guid? CoverImageId { get; private set; }
    public Guid AuthorUserId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? PublishedAt { get; private set; }
    public byte[] RowVersion { get; private set; } = Array.Empty<byte>();

    public User Author { get; private set; } = null!;
    public ICollection<ArticleImage> Images { get; private set; } = [];

    public static Article Create(
        string title,
        string excerpt,
        string contentJson,
        ArticleCategory category,
        bool isPinned,
        Guid? coverImageId,
        Guid authorUserId,
        DateTime now)
    {
        var article = new Article
        {
            AuthorUserId = authorUserId,
            CreatedAt = now,
            Status = ArticleStatus.Draft
        };
        article.ApplyEdit(title, excerpt, contentJson, category, isPinned, coverImageId, now);
        return article;
    }

    public bool Publish(DateTime now)
    {
        if (Status == ArticleStatus.Published)
            return false;
        EnsureStatus(ArticleStatus.Draft, "Only draft articles can be published.");

        var firstPublication = PublishedAt is null;
        PublishedAt ??= now;
        Status = ArticleStatus.Published;
        UpdatedAt = now;
        return firstPublication;
    }

    public void Unpublish(DateTime now)
    {
        EnsureStatus(ArticleStatus.Published, "Only published articles can be unpublished.");
        Status = ArticleStatus.Draft;
        UpdatedAt = now;
    }

    public void Archive(DateTime now)
    {
        if (Status is not (ArticleStatus.Draft or ArticleStatus.Published))
            throw new InvalidOperationException("Only draft or published articles can be archived.");
        Status = ArticleStatus.Archived;
        UpdatedAt = now;
    }

    public void Restore(DateTime now)
    {
        EnsureStatus(ArticleStatus.Archived, "Only archived articles can be restored.");
        Status = ArticleStatus.Draft;
        UpdatedAt = now;
    }

    public void ApplyEdit(
        string title,
        string excerpt,
        string contentJson,
        ArticleCategory category,
        bool isPinned,
        Guid? coverImageId,
        DateTime now)
    {
        Title = title.Trim();
        Excerpt = excerpt.Trim();
        ContentJson = contentJson;
        Category = category;
        IsPinned = isPinned;
        CoverImageId = coverImageId;
        UpdatedAt = now;
    }

    private void EnsureStatus(ArticleStatus expected, string message)
    {
        if (Status != expected)
            throw new InvalidOperationException(message);
    }
}

public sealed class ArticleImage : Entity<Guid>
{
    public ArticleImage()
    {
        Id = Guid.NewGuid();
    }

    public Guid? ArticleId { get; set; }
    public Guid UploadedByUserId { get; set; }
    public string StorageKey { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public long SizeBytes { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public Article? Article { get; set; }
    public User UploadedByUser { get; set; } = null!;
}

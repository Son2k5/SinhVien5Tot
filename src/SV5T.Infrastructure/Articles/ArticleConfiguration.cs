using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SV5T.Domain.Articles;

namespace SV5T.Infrastructure.Articles;

public sealed class ArticleConfiguration : IEntityTypeConfiguration<Article>
{
    public void Configure(EntityTypeBuilder<Article> builder)
    {
        builder.ToTable("articles");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Excerpt).HasMaxLength(300).IsRequired();
        builder.Property(x => x.ContentJson).HasColumnType("longtext").IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasIndex(x => new { x.Status, x.IsPinned, x.PublishedAt, x.Id });
        builder.HasIndex(x => new { x.Category, x.Status });

        builder.HasOne(x => x.Author)
            .WithMany()
            .HasForeignKey(x => x.AuthorUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ArticleImageConfiguration : IEntityTypeConfiguration<ArticleImage>
{
    public void Configure(EntityTypeBuilder<ArticleImage> builder)
    {
        builder.ToTable("article_images");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.StorageKey).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Url).HasMaxLength(2_048).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(100).IsRequired();

        builder.HasIndex(x => x.StorageKey).IsUnique();
        builder.HasIndex(x => x.ArticleId);
        builder.HasIndex(x => new { x.UploadedByUserId, x.ArticleId, x.CreatedAt });

        builder.HasOne(x => x.Article)
            .WithMany(x => x.Images)
            .HasForeignKey(x => x.ArticleId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.UploadedByUser)
            .WithMany()
            .HasForeignKey(x => x.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

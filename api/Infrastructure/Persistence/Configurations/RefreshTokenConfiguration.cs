using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SV5T.Domain.Entities;

namespace SV5T.Infrastructure.Persistence.Configurations;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");
        builder.HasKey(token => token.Id);

        builder.Property(token => token.Token)
            .HasMaxLength(64)
            .IsRequired();

        builder.HasIndex(token => token.Token).IsUnique();
        builder.HasIndex(token => new
        {
            token.UserId,
            token.IsRevoked,
            token.CreatedAtUtc
        });
        builder.HasIndex(token => token.ExpiresAtUtc);
        builder.HasIndex(token => token.RevokedAtUtc);

        builder.HasOne(token => token.User)
            .WithMany(user => user.RefreshTokens)
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

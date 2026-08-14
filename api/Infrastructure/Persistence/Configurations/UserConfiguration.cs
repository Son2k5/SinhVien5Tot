using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SV5T.Domain.Entities;

namespace SV5T.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(user => user.Id);

        builder.Property(user => user.Email)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(user => user.NormalizedEmail)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(user => user.DisplayName).HasMaxLength(100);

        builder.Property(user => user.PasswordHash)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(user => user.AvatarUrl).HasMaxLength(2048);
        builder.Property(user => user.AvatarPublicId).HasMaxLength(255);
        builder.Property(user => user.AvatarResourceType).HasMaxLength(50);
        builder.Property(user => user.CreatedBy).HasMaxLength(100);
        builder.Property(user => user.UpdatedBy).HasMaxLength(100);
        builder.Property(user => user.SecurityVersion).HasDefaultValue(1);
        builder.HasIndex(user => user.NormalizedEmail).IsUnique();
    }
}

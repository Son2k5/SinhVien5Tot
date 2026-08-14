using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SV5T.Domain.Entities;

namespace SV5T.Infrastructure.Persistence.Configurations;

public sealed class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("user_profiles");
        builder.HasKey(profile => profile.Id);

        builder.Property(profile => profile.FullName).HasMaxLength(255).IsRequired();
        builder.Property(profile => profile.IdentityCardNumber).HasMaxLength(2048).IsRequired();
        builder.Property(profile => profile.Ethnicity).HasMaxLength(100).IsRequired();
        builder.Property(profile => profile.School).HasMaxLength(255).IsRequired();
        builder.Property(profile => profile.Major).HasMaxLength(255);
        builder.Property(profile => profile.StudentCode).HasMaxLength(50).IsRequired();
        builder.Property(profile => profile.AdministrativeClass).HasMaxLength(100).IsRequired();
        builder.Property(profile => profile.Faculty).HasMaxLength(255).IsRequired();
        builder.Property(profile => profile.CurrentPosition).HasMaxLength(255).IsRequired();
        builder.Property(profile => profile.ContactEmail).HasMaxLength(2048).IsRequired();
        builder.Property(profile => profile.PhoneNumber).HasMaxLength(2048).IsRequired();
        builder.Property(profile => profile.UnionPosition).HasMaxLength(255);

        builder.HasIndex(profile => profile.UserId).IsUnique();
        builder.HasIndex(profile => profile.StudentCode).IsUnique();

        builder.HasOne(profile => profile.User)
            .WithOne(user => user.Profile)
            .HasForeignKey<UserProfile>(profile => profile.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

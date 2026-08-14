using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SV5T.Domain.Entities;

namespace SV5T.Infrastructure.Persistence.Configurations;

public sealed class UserAddressConfiguration : IEntityTypeConfiguration<UserAddress>
{
    public void Configure(EntityTypeBuilder<UserAddress> builder)
    {
        builder.ToTable("user_addresses");
        builder.HasKey(address => address.Id);

        builder.Property(address => address.ProvinceOrCity).HasMaxLength(255).IsRequired();
        builder.Property(address => address.District).HasMaxLength(255).IsRequired();
        builder.Property(address => address.StreetAddress).HasMaxLength(4096).IsRequired();

        builder.HasIndex(address => new { address.UserId, address.AddressType }).IsUnique();

        builder.HasOne(address => address.User)
            .WithMany(user => user.Addresses)
            .HasForeignKey(address => address.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

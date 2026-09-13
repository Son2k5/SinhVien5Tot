using Microsoft.Extensions.Logging.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Users.Commands.UpdateAvatar;
using SV5T.Application.Users.Commands.UpdateProfile;
using SV5T.Application.Users.Queries.GetMyProfile;
using SV5T.Application.Users.Queries.GetUserById;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class UserServiceTests
{
    [Fact]
    public async Task UpdateProfile_UpdatesExistingProfileAndAddresses()
    {
        var user = ActiveUser(withProfile: true);
        user.Addresses.Add(new UserAddress
        {
            UserId = user.Id,
            AddressType = AddressType.Temporary,
            ProvinceOrCity = "Old city",
            District = "Old district",
            StreetAddress = "Old street"
        });
        var service = CreateService(user, out _, out _);
        var request = ValidRequest() with
        {
            FullName = "Nguyen Van A",
            Addresses =
            [
                new UpdateUserAddressRequest(
                    AddressType.Permanent, "Ha Noi", "Cau Giay", "So 1"),
                new UpdateUserAddressRequest(
                    AddressType.Temporary, "Da Nang", "Hai Chau", "So 2")
            ]
        };

        var result = await service.UpdateMyProfileAsync(user.Id, request);

        Assert.Equal("Nguyen Van A", user.Profile!.FullName);
        Assert.Equal("SV001", user.Profile.StudentCode);
        Assert.Equal(user.Profile.FullName, user.DisplayName);
        Assert.Equal(2, user.Addresses.Count);
        Assert.Equal("Da Nang", user.Addresses.Single(
            item => item.AddressType == AddressType.Temporary).ProvinceOrCity);
        Assert.Equal(2, result.Addresses.Count);
    }

    [Fact]
    public async Task UpdateProfile_CreatesProfileWhenMissing()
    {
        var user = ActiveUser(withProfile: false);
        var service = CreateService(user, out var repository, out _);
        var request = ValidRequest() with
        {
            Addresses =
            [
                new UpdateUserAddressRequest(
                    AddressType.Permanent, "Ha Noi", "Cau Giay", "So 1")
            ]
        };

        var result = await service.UpdateMyProfileAsync(user.Id, request);

        Assert.NotNull(user.Profile);
        Assert.Equal(user.Id, user.Profile!.UserId);
        Assert.Equal("SV001", result.StudentCode);
        Assert.Single(repository.AddedProfiles);
        Assert.Same(user.Profile, repository.AddedProfiles[0]);
        Assert.Single(repository.AddedAddresses);
        Assert.Same(user.Addresses.Single(), repository.AddedAddresses[0]);
    }

    [Fact]
    public async Task UpdateProfile_RemovesAddressesMissingFromReplacementPayload()
    {
        var user = ActiveUser(withProfile: true);
        user.Addresses.Add(new UserAddress
        {
            UserId = user.Id,
            AddressType = AddressType.Temporary
        });
        var service = CreateService(user, out _, out _);

        var result = await service.UpdateMyProfileAsync(user.Id, ValidRequest());

        Assert.Empty(user.Addresses);
        Assert.Empty(result.Addresses);
    }

    [Fact]
    public async Task UpdateProfile_InvalidRequestThrowsValidation()
    {
        var user = ActiveUser(withProfile: false);
        var service = CreateService(user, out _, out _);
        var request = ValidRequest() with { FullName = string.Empty };

        var exception = await Assert.ThrowsAsync<UseCaseException>(
            () => service.UpdateMyProfileAsync(user.Id, request));

        Assert.Equal(ApplicationErrorKind.Validation, exception.Kind);
    }

    [Fact]
    public async Task UpdateProfile_DuplicateStudentCodeThrowsConflict()
    {
        var user = ActiveUser(withProfile: false);
        var other = ActiveUser(withProfile: true);
        other.Profile!.StudentCode = "SV001";
        var repository = new FakeUserRepository(user, other);
        var service = CreateService(user, repository, new FakeAvatarStorage());

        var exception = await Assert.ThrowsAsync<UseCaseException>(
            () => service.UpdateMyProfileAsync(user.Id, ValidRequest()));

        Assert.Equal(ApplicationErrorKind.Conflict, exception.Kind);
        Assert.Equal("student_code_taken", exception.ErrorCode);
    }

    [Fact]
    public async Task UpdateAvatar_PersistsCloudinaryResult()
    {
        var user = ActiveUser(withProfile: false);
        var service = CreateService(user, out _, out var storage);
        await using var content = new MemoryStream(
            [0xff, 0xd8, 0xff, 0x00, 0x01]);

        var result = await service.UpdateMyAvatarAsync(
            user.Id,
            new UpdateUserAvatarRequest(content, "avatar.jpg", content.Length));

        Assert.Equal(storage.Uploaded.Url, user.AvatarUrl);
        Assert.Equal(storage.Uploaded.PublicId, user.AvatarPublicId);
        Assert.Equal(storage.Uploaded.Url, result.AvatarUrl);
    }

    private static UserService CreateService(
        User user,
        out FakeUserRepository repository,
        out FakeAvatarStorage storage)
    {
        repository = new FakeUserRepository(user);
        storage = new FakeAvatarStorage();
        return CreateService(user, repository, storage);
    }

    private static UserService CreateService(
        User current,
        FakeUserRepository repository,
        FakeAvatarStorage storage)
    {
        var currentUser = new FakeCurrentUser(current.Id);
        var unitOfWork = new FakeUnitOfWork();
        return new UserService(
            new GetUserByIdHandler(currentUser, repository),
            new GetMyProfileHandler(currentUser, repository),
            new UpdateProfileHandler(currentUser, repository, unitOfWork, new UpdateUserProfileRequestValidator()),
            new UpdateAvatarHandler(currentUser, repository, unitOfWork, storage, NullLogger<UpdateAvatarHandler>.Instance));
    }

    private static User ActiveUser(bool withProfile) =>
        new()
        {
            Id = Guid.NewGuid(),
            Email = $"{Guid.NewGuid():N}@ms.hanu.edu.vn",
            NormalizedEmail = $"{Guid.NewGuid():N}@MS.HANU.EDU.VN",
            IsActive = true,
            IsVerified = true,
            Profile = withProfile
                ? new UserProfile
                {
                    FullName = "Old name",
                    StudentCode = $"OLD{Guid.NewGuid():N}",
                    School = "HANU",
                    Faculty = "FIT"
                }
                : null
        };

    private static UpdateUserProfileRequest ValidRequest() =>
        new(
            "Nguyen Van A",
            new DateOnly(2003, 1, 1),
            Gender.Male,
            "001203000001",
            "Kinh",
            "HANU",
            "Information Technology",
            4,
            "sv001",
            "CNTT01",
            "FIT",
            "Student",
            "student@ms.hanu.edu.vn",
            "0912345678",
            null,
            PoliticalStatus.UnionMember,
            []);

    private sealed class FakeCurrentUser(Guid userId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId => userId;
        public bool IsInRole(string role) => false;
    }

    private sealed class FakeUserRepository(params User[] users) : IUserRepository
    {
        public List<UserProfile> AddedProfiles { get; } = [];

        public List<UserAddress> AddedAddresses { get; } = [];

        public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(users.FirstOrDefault(user => user.Id == id));

        public Task<SV5T.Application.Users.Dtos.UserSummaryResponse?> GetSummaryByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var user = users.FirstOrDefault(u => u.Id == id);
            if (user == null) return Task.FromResult<SV5T.Application.Users.Dtos.UserSummaryResponse?>(null);
            return Task.FromResult<SV5T.Application.Users.Dtos.UserSummaryResponse?>(new SV5T.Application.Users.Dtos.UserSummaryResponse(
                user.Id,
                user.Email,
                user.DisplayName,
                user.Role,
                user.AvatarUrl,
                user.IsVerified,
                user.IsActive,
                user.SecurityVersion,
                user.CreatedAt,
                user.UpdatedAt,
                user.Profile?.FullName,
                user.Profile?.Faculty));
        }
        public Task<User?> GetByNormalizedEmailAsync(
            string normalizedEmail, bool tracking = false,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(users.FirstOrDefault(user => user.NormalizedEmail == normalizedEmail));
        public Task<User?> GetByIdWithProfileAsync(
            Guid id, bool tracking = false,
            CancellationToken cancellationToken = default) =>
            GetByIdAsync(id, cancellationToken);
        public Task<bool> ExistsStudentCodeAsync(
            string studentCode, Guid excludeUserId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(users.Any(user => user.Id != excludeUserId &&
                user.Profile?.StudentCode == studentCode));
        public Task AddProfileAsync(
            UserProfile profile,
            CancellationToken cancellationToken = default)
        {
            AddedProfiles.Add(profile);
            return Task.CompletedTask;
        }

        public Task AddAddressAsync(
            UserAddress address,
            CancellationToken cancellationToken = default)
        {
            AddedAddresses.Add(address);
            return Task.CompletedTask;
        }

        public Task AddAsync(User user, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
        public Task<int> DeleteUnverifiedBeforeAsync(
            DateTime cutoffUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(0);
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(1);
        public Task ExecuteInTransactionAsync(
            Func<CancellationToken, Task> operation,
            CancellationToken cancellationToken = default) =>
            operation(cancellationToken);
    }

    private sealed class FakeAvatarStorage : IAvatarStorage
    {
        public StoredAvatar Uploaded { get; } =
            new("https://res.cloudinary.com/test/avatar.jpg", "avatar-id", "image");
        public List<string> Deleted { get; } = [];
        public Task<StoredAvatar> UploadAsync(
            Guid userId, Stream content, string fileName,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Uploaded);
        public Task DeleteAsync(
            string publicId, string resourceType,
            CancellationToken cancellationToken = default)
        {
            Deleted.Add(publicId);
            return Task.CompletedTask;
        }
    }
}



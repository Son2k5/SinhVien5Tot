using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Users.Abstractions;

namespace SV5T.Application.Me;

public sealed record GetMyStaffProfileQuery : IRequest<MyStaffProfileResponse>;

public sealed class GetMyStaffProfileHandler(
    ICurrentUser currentUser,
    IUserRepository users)
    : IRequestHandler<GetMyStaffProfileQuery, MyStaffProfileResponse>
{
    public async Task<MyStaffProfileResponse> Handle(
        GetMyStaffProfileQuery request,
        CancellationToken cancellationToken)
    {
        var userId = MyStaffProfileSupport.RequireStaffUserId(currentUser);
        return await users.GetMyStaffProfileAsync(userId, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy hồ sơ nhân sự.",
                "staff_profile_not_found");
    }
}

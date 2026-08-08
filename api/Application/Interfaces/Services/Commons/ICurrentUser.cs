namespace SV5T.Application.Interfaces.Services.Commons;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }

    Guid? UserId { get; }

    bool IsInRole(string role);
}

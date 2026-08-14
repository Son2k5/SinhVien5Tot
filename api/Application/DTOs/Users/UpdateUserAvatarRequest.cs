namespace SV5T.Application.DTOs.Users;

public sealed record UpdateUserAvatarRequest(
    Stream Content,
    string FileName,
    long Length);

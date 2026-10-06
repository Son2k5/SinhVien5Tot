using FluentValidation;
using MediatR;
using Microsoft.Extensions.Configuration;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Chat;

public sealed record StartSupportConversationCommand(Guid? ApplicationId) : IRequest<ConversationIdResponse>;

public sealed class StartSupportConversationCommandValidator : AbstractValidator<StartSupportConversationCommand>
{
    public StartSupportConversationCommandValidator() =>
        RuleFor(x => x.ApplicationId).Must(x => !x.HasValue || x.Value != Guid.Empty)
            .WithMessage("Mã hồ sơ không hợp lệ.");
}

public sealed class StartSupportConversationHandler(
    IChatRepository chats,
    ICurrentUser currentUser,
    IConfiguration configuration,
    ISender sender) : IRequestHandler<StartSupportConversationCommand, ConversationIdResponse>
{
    public async Task<ConversationIdResponse> Handle(StartSupportConversationCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
        var me = await chats.GetUserAsync(userId, cancellationToken)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Không tìm thấy người dùng.", "user_not_found");
        if (me.Role != Role.User)
            throw new UseCaseException(ApplicationErrorKind.Validation,
                "Chức năng hỗ trợ này dành cho sinh viên.", "support_student_only");

        Guid? targetId = null;
        if (request.ApplicationId.HasValue)
        {
            var application = await chats.GetApplicationAsync(request.ApplicationId.Value, cancellationToken)
                ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Không tìm thấy hồ sơ.", "application_not_found");
            if (application.ApplicantUserId != userId)
                throw new UseCaseException(ApplicationErrorKind.Validation,
                    "Hồ sơ không thuộc người dùng hiện tại.", "application_not_owned");
            targetId = application.AssignedReviewerId;
        }
        else
        {
            targetId = await chats.GetLatestSupportContactAsync(userId, cancellationToken);
        }

        if (!targetId.HasValue)
        {
            var configured = Guid.TryParse(configuration["Chat:DefaultSupportUserId"], out var configuredId)
                ? configuredId
                : (Guid?)null;
            targetId = await chats.GetSupportAdminAsync(userId, configured, cancellationToken);
        }

        if (!targetId.HasValue)
            throw new UseCaseException(ApplicationErrorKind.Conflict,
                "Hiện chưa có nhân sự hỗ trợ khả dụng.", "support_unavailable");

        return await sender.Send(new StartConversationCommand(targetId.Value), cancellationToken);
    }
}

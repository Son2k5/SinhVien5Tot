namespace SV5T.Domain.Submissions.Enums;

public enum SubmissionStatus
{
    Draft = 1,
    Submitted = 2,
    UnderReview = 3,
    NeedsRevision = 4,
    Resubmitted = 5,
    Approved = 6,
    Rejected = 7,
    Withdrawn = 8
}
public enum SubmissionReviewDecision
{
    Approved = 1,
    Rejected = 2,
    NeedsRevision = 3
}
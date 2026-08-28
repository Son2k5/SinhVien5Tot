namespace SV5T.Domain.Submissions.Enums;

public enum ApplicationKind
{
    Individual = 1,
    Collective = 2
}

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

public enum EvidenceStatus
{
    Draft = 1,
    Submitted = 2,
    Approved = 3,
    Rejected = 4,
    NeedsRevision = 5
}

public enum ReviewAction
{
    ApplicationCreated = 1,
    ApplicationSubmitted = 2,
    ReviewerAssigned = 3,
    ReviewStarted = 4,
    EvidenceApproved = 5,
    EvidenceRejected = 6,
    EvidenceRevisionRequested = 7,
    ApplicationApproved = 8,
    ApplicationRejected = 9,
    ApplicationRevisionRequested = 10,
    ApplicationResubmitted = 11,
    RecommendedForNextLevel = 12
}

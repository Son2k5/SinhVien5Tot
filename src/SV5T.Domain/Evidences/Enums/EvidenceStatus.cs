namespace SV5T.Domain.Evidences.Enums
{
    public enum EvidenceStatus
    {
        Draft = 1,
        Submitted = 2,
        Locked = 3,
        Returned = 4
    }
    public enum ReviewAction
    {
        ApplicationClaimed = 1,
        CriterionPassed = 2,
        CriterionFailed = 3,
        CriterionRevisionRequested = 4,
        ApplicationApproved = 5,
        ApplicationRejected = 6,
        ApplicationRevisionRequested = 7,
        ApplicationResubmitted = 8,
        RecommendedForNextLevel = 9
    }
}
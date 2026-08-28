namespace SV5T.Domain.Standards.Enums;

public enum StandardSetStatus
{
    Draft = 1,
    Published = 2,
    Archived = 3
}

public enum StandardGroupCode
{
    Ethics = 1,
    Study = 2,
    Fitness = 3,
    Volunteer = 4,
    Integration = 5
}

public enum CriterionType
{
    Group = 1,
    Requirement = 2
}

public enum CriterionOperator
{
    All = 1,
    Any = 2,
    AtLeast = 3
}

public enum CriterionEvaluationType
{
    Manual = 1,
    Boolean = 2,
    NumericThreshold = 3,
    AccumulatedNumeric = 4
}

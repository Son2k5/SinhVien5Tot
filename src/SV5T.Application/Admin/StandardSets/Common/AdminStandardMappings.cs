using SV5T.Application.Admin.Dtos;
using SV5T.Domain.Criteria;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Common;

public static class AdminStandardMappings
{
    public static readonly (
        StandardGroupCode GroupCode,
        string Code,
        string Title,
        string Description,
        int DisplayOrder
    )[] DefaultIndividualStandards =
    [
        (
            StandardGroupCode.Ethics,
            "TC_DAODUC",
            "Dao duc tot",
            "Danh gia ve tu tuong chinh tri, dao duc, loi song va y thuc chap hanh phap luat, noi quy nha truong.",
            1
        ),
        (
            StandardGroupCode.Study,
            "TC_HOCTAP",
            "Hoc tap tot",
            "Danh gia ve ket qua hoc tap, nghien cuu khoa hoc va tinh than hoc hoi sang tao.",
            2
        ),
        (
            StandardGroupCode.Fitness,
            "TC_THELUC",
            "The luc tot",
            "Danh gia ve ren luyen the chat, the duc the thao va chung nhan the luc.",
            3
        ),
        (
            StandardGroupCode.Volunteer,
            "TC_TINHNGUYEN",
            "Tinh nguyen tot",
            "Danh gia ve viec tham gia cac hoat dong tinh nguyen vi cong dong, an sinh xa hoi.",
            4
        ),
        (
            StandardGroupCode.Integration,
            "TC_HOINHAP",
            "Hoi nhap tot",
            "Danh gia ve trinh do ngoai ngu, ky nang mem va cac hoat dong giao luu quoc te.",
            5
        ),
    ];

    public static List<Standard> CloneStandards(
        IEnumerable<Standard> sourceStandards,
        Guid newStandardSetId,
        Guid actorId
    )
    {
        var now = DateTime.UtcNow;
        var result = new List<Standard>();
        foreach (var sourceStd in sourceStandards)
        {
            var newStdId = Guid.NewGuid();
            var std = new Standard
            {
                Id = newStdId,
                StandardSetId = newStandardSetId,
                GroupCode = sourceStd.GroupCode,
                Code = sourceStd.Code,
                Title = sourceStd.Title,
                Description = sourceStd.Description,
                DisplayOrder = sourceStd.DisplayOrder,
                Operator = sourceStd.Operator,
                MinimumSatisfied = sourceStd.MinimumSatisfied,
                CreatedAt = now,
                CreatedBy = actorId.ToString(),
            };
            var idMap = sourceStd.Criteria.ToDictionary(x => x.Id, _ => Guid.NewGuid());
            std.Criteria = sourceStd
                .Criteria.Select(x =>
                {
                    Guid? mappedParentId = null;
                    if (
                        x.ParentCriterionId.HasValue
                        && idMap.TryGetValue(x.ParentCriterionId.Value, out var parentNewId)
                    )
                    {
                        mappedParentId = parentNewId;
                    }
                    return new Criterion
                    {
                        Id = idMap[x.Id],
                        StandardId = newStdId,
                        ParentCriterionId = mappedParentId,
                        Type = x.Type,
                        Code = x.Code,
                        Title = x.Title,
                        Description = x.Description,
                        DisplayOrder = x.DisplayOrder,
                        Operator = x.Operator,
                        MinimumSatisfied = x.MinimumSatisfied,
                        EvaluationType = x.EvaluationType,
                        DefinitionJson = x.DefinitionJson,
                        ReviewGuidance = x.ReviewGuidance,
                        CreatedAt = now,
                        CreatedBy = actorId.ToString(),
                    };
                })
                .ToList();
            result.Add(std);
        }
        return result;
    }

    public static StandardSetResponse MapToSetResponse(StandardSet standardSet, bool includeStandards) =>
        new(
            standardSet.Id,
            standardSet.Name,
            standardSet.AcademicYear,
            standardSet.Level,
            standardSet.AwardType,
            standardSet.Status,
            standardSet.Version,
            standardSet.PreviousVersionId,
            standardSet.CreatedAt,
            standardSet.PublishedAt,
            includeStandards
                ? standardSet.Standards.OrderBy(x => x.DisplayOrder).Select(MapToStandardResponse).ToList()
                : null
        );

    public static StandardResponse MapToStandardResponse(Standard standard) =>
        new(
            standard.Id,
            standard.StandardSetId,
            standard.GroupCode,
            standard.Code,
            standard.Title,
            standard.Description,
            standard.DisplayOrder,
            standard.Operator,
            standard.MinimumSatisfied,
            standard.Criteria?.OrderBy(x => x.DisplayOrder).Select(MapToCriterionResponse).ToList()
        );

    public static CriterionResponse MapToCriterionResponse(Criterion criterion) =>
        new(
            criterion.Id,
            criterion.StandardId,
            criterion.ParentCriterionId,
            criterion.Type,
            criterion.Code,
            criterion.Title,
            criterion.Description,
            criterion.DisplayOrder,
            criterion.Operator,
            criterion.MinimumSatisfied,
            criterion.EvaluationType,
            criterion.DefinitionJson,
            criterion.ReviewGuidance
        );
}

namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>Rəy uyğunluğu: { delivered, reviewed, pending } — məhsul id siyahıları.</summary>
public record ReviewEligibility(List<int> Delivered, List<int> Reviewed, List<int> Pending);

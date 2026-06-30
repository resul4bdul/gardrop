namespace Gardrop.Core.Application.Common;

/// <summary>
/// Application qatından nəticə + HTTP status — controller-i nazik saxlamaq üçün (bax menfiler D1/D2).
/// Birdən çox nəticəsi olan əməliyyatlarda (404/403/400/201 ...) istifadə olunur.
/// </summary>
public record OpResult(int Status, object? Data = null, string? Error = null)
{
    public bool IsSuccess => Status is >= 200 and < 300;

    public static OpResult Ok(object? data) => new(200, data);
    public static OpResult Created(object? data) => new(201, data);
    public static OpResult Fail(int status, string error) => new(status, null, error);
}

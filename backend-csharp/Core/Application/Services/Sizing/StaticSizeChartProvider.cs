using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// EN 13402 / TR baselayn ölçü bantları — kodda (əvvəlki hardcoded massivlərlə BİT-BİT eyni dəyərlər).
/// DB-driven-a keçid: eyni <see cref="SizeChartBandDto"/> sətirlərini DB-dən oxuyan impl yaz, DI-də əvəzlə.
/// </summary>
public sealed class StaticSizeChartProvider : ISizeChartProvider
{
    private static readonly string[] Labels = { "XS", "S", "M", "L", "XL", "XXL", "3XL" };

    // (min, max) sm — cinsiyyətə görə. Əvvəlki SizeEngine massivləri ilə eynidir.
    private static readonly (double Min, double Max)[] WomenChest = { (78, 82), (82, 86), (86, 92), (92, 98), (98, 104), (104, 112), (112, 122) };
    private static readonly (double Min, double Max)[] WomenWaist = { (60, 64), (64, 68), (68, 74), (74, 80), (80, 86), (86, 94), (94, 104) };
    private static readonly (double Min, double Max)[] WomenHip   = { (86, 90), (90, 94), (94, 100), (100, 106), (106, 114), (114, 124), (124, 136) };
    private static readonly (double Min, double Max)[] MenChest   = { (82, 88), (88, 94), (94, 100), (100, 106), (106, 112), (112, 118), (118, 128) };
    private static readonly (double Min, double Max)[] MenWaist   = { (70, 76), (76, 82), (82, 88), (88, 94), (94, 100), (100, 108), (108, 118) };
    private static readonly (double Min, double Max)[] MenHip     = { (88, 92), (92, 98), (98, 104), (104, 110), (110, 118), (118, 128), (128, 140) };

    private static readonly IReadOnlyList<SizeChartBandDto> WomenBands = Build(WomenChest, WomenWaist, WomenHip);
    private static readonly IReadOnlyList<SizeChartBandDto> MenBands = Build(MenChest, MenWaist, MenHip);

    private static IReadOnlyList<SizeChartBandDto> Build((double, double)[] chest, (double, double)[] waist, (double, double)[] hip) =>
        Enumerable.Range(0, Labels.Length).Select(i => new SizeChartBandDto(
            i, Labels[i], chest[i].Item1, chest[i].Item2, waist[i].Item1, waist[i].Item2, hip[i].Item1, hip[i].Item2)).ToList();

    // Qeyd: brend hazırda banta təsir etmir (yalnız davranış — bax IBrandBehaviorProvider).
    // Parametr DB-driven imzasını qorumaq üçün saxlanılır.
    public IReadOnlyList<SizeChartBandDto> GetBands(string category, Gender gender, string? brand)
    {
        bool women = gender == Gender.Female;
        return women ? WomenBands : MenBands;
    }
}

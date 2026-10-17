namespace Gardrop.Core.Application.Common.DTOs;

// Frontend ölçüləri string kimi göndərir ("180" / "" / yoxdur) — Node-dakı Number() məntiqi.
// dos/bel = dəqiq sm (istəyə bağlı), dosFit/belFit = dar/orta/geniş, ayaqqabi = EU ölçü.
public record MeasurementsDto(
    string? Boy, string? Ceki, string? Dos, string? Bel, string? Omba, string? Yas,
    string? DosFit, string? BelFit, string? QarinFit, string? AyaqFit, string? Ayaqqabi,
    string? FitPreference, string? OmbaFit);

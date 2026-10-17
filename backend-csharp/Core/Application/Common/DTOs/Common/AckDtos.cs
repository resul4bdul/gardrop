namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>Sadə uğur cavabı: { ok: true }.</summary>
public record OkResult(bool Ok = true);

/// <summary>Uğur + mesaj cavabı: { ok: true, message }.</summary>
public record OkMessageResult(string Message, bool Ok = true);

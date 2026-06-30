using System.Collections.Concurrent;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// YALNIZ Development: göndərilən son OTP/təsdiq kodunu yaddaşda saxlayır ki, e2e testi
/// emaili oxumadan girişi tamamlaya bilsin (bax C.1). Prod-da decorator qoşulmur → boş qalır.
/// </summary>
public sealed class DevCodeCapture
{
    private readonly ConcurrentDictionary<string, string> _last = new(StringComparer.OrdinalIgnoreCase);
    public void Set(string email, string code) => _last[email] = code;
    public string? Get(string email) => _last.TryGetValue(email, out var c) ? c : null;
}

using System.ComponentModel.DataAnnotations;

namespace Gardrop.Infrastructure.Services;

/// <summary>Google OAuth konfiqurasiyası (appsettings "Google" bölməsi).</summary>
public sealed class GoogleOptions
{
    /// <summary>Google OAuth web client id (id_token audience yoxlaması üçün).</summary>
    public string ClientId { get; set; } = "";
}

using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace Gardrop.Core.Application.Common.Validation;

/// <summary>
/// Giriş DTO-larını tək yerdə yoxlayır (bax menfiler 3.4). Servis metodları hər
/// null/format/uzunluq yoxlamasını təkrarlamaq əvəzinə girişi bir çağırışla yoxlayır.
/// Həqiqət mənbəyi DTO-dakı DataAnnotations atributlarıdır — eyni atributlar HTTP qatında
/// da işlədilir (Program.cs InvalidModelStateResponseFactory), beləliklə HTTP və birbaşa
/// (test/daxili) çağırışlar eyni qaydalara tabe olur (DRY + defense-in-depth).
/// Uğursuzluqda {error} formatına uyğun ilk mesajla 400 qaytarır; uğurda null.
/// </summary>
public interface IValidationService
{
    OpResult? Validate<T>(T instance) where T : notnull;
}

/// <summary>
/// DataAnnotations-əsaslı implementasiya. DİQQƏT: bu DTO-lar `record`-dur və ASP.NET MVC
/// konvensiyası ilə validation atributları PRİMARY KONSTRUKTOR PARAMETRİNDƏ olmalıdır
/// (property-də olsa MVC istisna atır). Lakin <see cref="Validator.TryValidateObject"/>
/// yalnız property atributlarını oxuyur. Buna görə burada parametr atributları reflection-la
/// oxunur (MVC ilə EYNİ mənbə) — həm record param, həm də (record olmayan DTO üçün) property.
/// </summary>
public sealed class DataAnnotationsValidationService : IValidationService
{
    // Tip üzrə (parametr atributu) cache — reflection-u hər çağırışda təkrarlamamaq üçün.
    private static readonly ConcurrentDictionary<Type, (PropertyInfo Prop, ValidationAttribute[] Attrs)[]> _cache = new();

    public OpResult? Validate<T>(T instance) where T : notnull
    {
        var results = new List<ValidationResult>();

        foreach (var (prop, attrs) in ParamRules(typeof(T)))
        {
            var ctx = new ValidationContext(instance) { MemberName = prop.Name, DisplayName = prop.Name };
            Validator.TryValidateValue(prop.GetValue(instance)!, ctx, results, attrs);
        }

        // Record olmayan / property-də atributu olan DTO-ları da əhatə et.
        Validator.TryValidateObject(instance, new ValidationContext(instance), results, validateAllProperties: true);

        var msg = results
            .Select(r => r.ErrorMessage)
            .FirstOrDefault(m => !string.IsNullOrWhiteSpace(m));
        return msg is null ? null : OpResult.Fail(400, msg);
    }

    // Primary konstruktor parametrlərindəki validation atributlarını uyğun property ilə cütləşdirir.
    private static (PropertyInfo Prop, ValidationAttribute[] Attrs)[] ParamRules(Type type) =>
        _cache.GetOrAdd(type, static t =>
        {
            var ctor = t.GetConstructors().FirstOrDefault();
            if (ctor is null) return [];
            return ctor.GetParameters()
                .Select(p => (Prop: t.GetProperty(p.Name!), Attrs: p.GetCustomAttributes<ValidationAttribute>(inherit: true).ToArray()))
                .Where(x => x.Prop is not null && x.Attrs.Length > 0)
                .Select(x => (x.Prop!, x.Attrs))
                .ToArray();
        });
}

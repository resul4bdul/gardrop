using System.Text.Json;
using Gardrop.Core.Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Infrastructure.Middlewares;

/// <summary>
/// Tutulmamış istisnaları vahid JSON formatına (`{ error }`) çevirir.
/// <see cref="AppException"/> öz status kodunu daşıyır; digər istisnalar 500 olur.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _log;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> log)
    {
        _next = next;
        _log = log;
    }

    public async Task Invoke(HttpContext ctx)
    {
        try
        {
            await _next(ctx);
        }
        catch (AppException ex)
        {
            await WriteAsync(ctx, ex.StatusCode, ex.Message);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Optimistik konkurensiya toqquşması (xmin token — bax menfiler 2.4): eyni stok/kupon
            // eyni anda dəyişdi. Səssiz oversell əvəzinə 409 → müştəri yenidən cəhd edə bilər.
            await WriteAsync(ctx, 409, "Əməliyyat eyni anda başqa dəyişikliklə toqquşdu. Yenidən cəhd edin.");
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Tutulmamış istisna");
            await WriteAsync(ctx, 500, "Daxili server xətası");
        }
    }

    private static async Task WriteAsync(HttpContext ctx, int status, string error)
    {
        if (ctx.Response.HasStarted) return;
        ctx.Response.Clear();
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json; charset=utf-8";
        // `error` açarı saxlanılır (frontend ona bağlıdır); traceId diaqnostika üçün əlavə.
        var traceId = System.Diagnostics.Activity.Current?.Id ?? ctx.TraceIdentifier;
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(new { error, traceId }));
    }
}

public static class ExceptionHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseExceptionHandling(this IApplicationBuilder app) =>
        app.UseMiddleware<ExceptionHandlingMiddleware>();
}

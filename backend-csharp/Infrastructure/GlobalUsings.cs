// ── Infrastructure qlobal usings ── (Core + öz qatının namespace-ləri)

// ASP.NET / Extensions implicit usings — köhnə Web SDK layihəsində avtomatik gəlirdi;
// classlib (Microsoft.NET.Sdk) bunları gətirmir, ona görə əl ilə əlavə olunur
// (assembly-lər FrameworkReference Microsoft.AspNetCore.App ilə gəlir).
global using Microsoft.AspNetCore.Builder;
global using Microsoft.AspNetCore.Hosting;
global using Microsoft.AspNetCore.Http;
global using Microsoft.AspNetCore.Routing;
global using Microsoft.Extensions.Configuration;
global using Microsoft.Extensions.DependencyInjection;
global using Microsoft.Extensions.Hosting;
global using Microsoft.Extensions.Logging;

global using Gardrop.Core.Domain.Models;
global using Gardrop.Core.Application.Common.DTOs;
global using Gardrop.Core.Application.Common.Interfaces;
global using Gardrop.Core.Application.Common.Helpers;
global using Gardrop.Core.Application.Common.Exceptions;
global using Gardrop.Infrastructure.Persistance.Data;
global using Gardrop.Infrastructure.Services;
global using Gardrop.Infrastructure.Middlewares;
global using Gardrop.Core.Application.Services;
global using Gardrop.Core.Application.Mappings;

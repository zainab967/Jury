using System.Text.Json;
using System.Text.Json.Serialization;
using JuryApi.Authorization;
using JuryApi.Data;
using JuryApi.Middleware;
using JuryApi.Options;
using JuryApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Serilog;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
        .AddEnvironmentVariables()
        .Build())
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .WriteTo.Console()
    .WriteTo.File("logs/jury-api-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("Starting Jury API application");

    var builder = WebApplication.CreateBuilder(args);

    // Use Serilog for logging
    builder.Host.UseSerilog();

    builder.Services.AddControllers().AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        // Allow enums to be deserialized from both integers and strings
        // Use original enum names: "JURY", "EMPLOYEE" (not camelCase)
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(null, allowIntegerValues: true));
    });
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SupportNonNullableReferenceTypes();
        options.UseAllOfToExtendReferenceSchemas();
        options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "Jury Harmony API",
            Version = "v1",
            Description = "API for managing jury harmony system"
        });
    });

    var frontendOrigins = builder.Configuration.GetSection("Frontend:Origins").Get<string[]>()
                           ?? Array.Empty<string>();

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("FrontendPolicy", policy =>
        {
            if (frontendOrigins.Length == 0)
            {
                policy.AllowAnyOrigin()
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .SetPreflightMaxAge(TimeSpan.FromSeconds(86400));
            }
            else
            {
                policy.WithOrigins(frontendOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .SetPreflightMaxAge(TimeSpan.FromSeconds(86400));
            }
        });
    });

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                          ?? throw new InvalidOperationException("Database connection string 'DefaultConnection' is not configured.");

    builder.Services.AddDbContext<JuryDbContext>(options =>
        options.UseSqlServer(connectionString));

    builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

    var authSection = builder.Configuration.GetSection(AuthOptions.SectionName);
    var authOptions = authSection.Get<AuthOptions>() ?? new AuthOptions();
    var authEnabled = authOptions.HasRequiredKeys;

    // Always configure AuthOptions so services can use it
    builder.Services.Configure<AuthOptions>(authSection);
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IJwtService, JwtService>();

    if (authEnabled)
    {
        var signingKey = CreateSymmetricSecurityKey(authOptions.SigningKey, nameof(authOptions.SigningKey));
        var encryptionKey = CreateSymmetricSecurityKey(authOptions.EncryptionKey, nameof(authOptions.EncryptionKey));

        builder.Services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = !string.IsNullOrWhiteSpace(authOptions.Issuer),
                    ValidIssuer = authOptions.Issuer,
                    ValidateAudience = !string.IsNullOrWhiteSpace(authOptions.Audience),
                    ValidAudience = authOptions.Audience,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = signingKey,
                    TokenDecryptionKey = encryptionKey,
                    ClockSkew = authOptions.ClockSkew
                };
            });

        builder.Services.AddAuthorization(options =>
        {
            // Allow anonymous access by default, require authorization only where [Authorize] is specified
            options.FallbackPolicy = null;
            AuthorizationPolicies.ConfigurePolicies(options);
        });
    }
    else
    {
        builder.Services.AddAuthorization(options =>
        {
            options.FallbackPolicy = options.DefaultPolicy = new AuthorizationPolicyBuilder()
                .RequireAssertion(_ => true)
                .Build();
            AuthorizationPolicies.ConfigurePolicies(options);
        });
    }

    var app = builder.Build();

    // Configure the HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
        app.MapGet("/", () => Results.Redirect("/swagger"));
    }

    // Global exception handling middleware (must be early in pipeline)
    app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

    app.UseRouting();
    
    // CORS must be before UseHttpsRedirection to avoid preflight redirect issues
    app.UseCors("FrontendPolicy");
    
    // Disable HTTPS redirection in development to avoid CORS preflight issues
    // HTTPS redirection causes "Redirect is not allowed for a preflight request" error
    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }
    
    // Always use authentication middleware if auth is enabled
    if (authEnabled)
    {
        app.UseAuthentication();
    }
    
    app.UseAuthorization();
    app.MapControllers();

    try
    {
        Log.Information("Jury API application started successfully");
        app.Run();
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "Application terminated unexpectedly");
        throw;
    }
    finally
    {
        Log.CloseAndFlush();
    }
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application failed to start");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

static SymmetricSecurityKey CreateSymmetricSecurityKey(string base64Key, string keyName)
{
    if (string.IsNullOrWhiteSpace(base64Key))
    {
        throw new InvalidOperationException($"Auth configuration '{keyName}' is missing.");
    }

    try
    {
        return new SymmetricSecurityKey(Convert.FromBase64String(base64Key));
    }
    catch (FormatException ex)
    {
        throw new InvalidOperationException($"Auth configuration '{keyName}' must be a valid Base64 string.", ex);
    }
}

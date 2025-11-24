using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;

namespace JuryApi.Middleware
{
    public class GlobalExceptionHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

        public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred. Request: {Method} {Path}", 
                    context.Request.Method, context.Request.Path);
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var statusCode = HttpStatusCode.InternalServerError;
            var message = "An error occurred while processing your request.";

            switch (exception)
            {
                case DbUpdateConcurrencyException:
                    statusCode = HttpStatusCode.Conflict;
                    message = "The resource was modified by another request. Please refresh and try again.";
                    break;

                case DbUpdateException dbEx:
                    statusCode = HttpStatusCode.BadRequest;
                    message = GetDatabaseErrorMessage(dbEx);
                    // Log the actual exception for debugging
                    _logger.LogError(dbEx, "Database error: {Message}", dbEx.Message);
                    if (dbEx.InnerException != null)
                    {
                        _logger.LogError(dbEx.InnerException, "Inner exception: {Message}", dbEx.InnerException.Message);
                    }
                    break;

                case UnauthorizedAccessException:
                    statusCode = HttpStatusCode.Unauthorized;
                    message = "You are not authorized to perform this action.";
                    break;

                case ArgumentException argEx:
                    statusCode = HttpStatusCode.BadRequest;
                    message = argEx.Message;
                    break;

                case InvalidOperationException invOpEx:
                    statusCode = HttpStatusCode.BadRequest;
                    message = invOpEx.Message;
                    break;

                case KeyNotFoundException:
                    statusCode = HttpStatusCode.NotFound;
                    message = "The requested resource was not found.";
                    break;
            }

            var response = new
            {
                error = new
                {
                    message,
                    statusCode = (int)statusCode,
                    timestamp = DateTime.UtcNow
                }
            };

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            return context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
        }

        private static string GetDatabaseErrorMessage(DbUpdateException dbEx)
        {
            // Check for SQL Server unique constraint violations
            if (dbEx.InnerException is SqlException sqlEx)
            {
                // SQL Server error code 2627 = Unique constraint violation
                // SQL Server error code 2601 = Unique index violation
                if (sqlEx.Number == 2627 || sqlEx.Number == 2601)
                {
                    var errorMessage = sqlEx.Message;
                    // Try to extract the column name from the error message
                    if (errorMessage.Contains("Email") || errorMessage.Contains("email"))
                    {
                        return "This email address is already registered. Please use a different email.";
                    }
                    if (errorMessage.Contains("IX_Users_Email"))
                    {
                        return "This email address is already registered. Please use a different email.";
                    }
                    return "A record with this information already exists. Please check your input.";
                }
            }

            // Check the exception message for common patterns
            var message = dbEx.Message;
            if (message.Contains("UNIQUE") || message.Contains("unique constraint") || message.Contains("duplicate key"))
            {
                if (message.Contains("Email") || message.Contains("email"))
                {
                    return "This email address is already registered. Please use a different email.";
                }
                return "A record with this information already exists. Please check your input.";
            }

            // Generic database error
            return "A database error occurred. Please check your input and try again.";
        }
    }
}


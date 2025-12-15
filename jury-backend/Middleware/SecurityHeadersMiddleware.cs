using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace JuryApi.Middleware
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IWebHostEnvironment _environment;

        public SecurityHeadersMiddleware(RequestDelegate next, IWebHostEnvironment environment)
        {
            _next = next;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Add security headers to all responses
            var headers = context.Response.Headers;

            // Prevent clickjacking
            headers["X-Frame-Options"] = "DENY";

            // Prevent MIME type sniffing
            headers["X-Content-Type-Options"] = "nosniff";

            // Enable XSS protection (legacy, but still useful)
            headers["X-XSS-Protection"] = "1; mode=block";

            // Referrer Policy - control referrer information
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // Permissions Policy (formerly Feature-Policy)
            headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";

            // Content Security Policy
            // Adjust based on your needs - this is a restrictive policy
            var csp = "default-src 'self'; " +
                     "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // 'unsafe-inline'/'unsafe-eval' needed for Swagger in dev
                     "style-src 'self' 'unsafe-inline'; " +
                     "img-src 'self' data: https:; " +
                     "font-src 'self' data:; " +
                     "connect-src 'self'; " +
                     "frame-ancestors 'none'; " +
                     "base-uri 'self'; " +
                     "form-action 'self';";

            // Only add CSP in production, or make it less restrictive in development
            if (!_environment.IsDevelopment())
            {
                headers["Content-Security-Policy"] = csp;
            }
            else
            {
                // More permissive CSP for development (allows Swagger UI)
                headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; " +
                                                     "frame-ancestors 'none';";
            }

            await _next(context);
        }
    }
}


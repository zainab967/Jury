using JuryApi.Entities;
using JuryApi.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;

namespace JuryApi.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public class RequireRoleAttribute : Attribute, IAuthorizationFilter
    {
        private readonly UserRole[] _allowedRoles;

        public RequireRoleAttribute(params UserRole[] allowedRoles)
        {
            _allowedRoles = allowedRoles;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // Check if authentication is enabled
            var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var authSection = configuration.GetSection(AuthOptions.SectionName);
            var authOptions = authSection.Get<AuthOptions>() ?? new AuthOptions();
            var authEnabled = authOptions.HasRequiredKeys;

            // If authentication is disabled, allow all requests (for development/testing)
            if (!authEnabled)
            {
                return; // Allow the request to proceed
            }

            // Authentication is enabled - check for valid token and role
            var user = context.HttpContext.User;

            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var userRoleClaim = user.FindFirst(c => c.Type == "role" || c.Type == "Role")?.Value;

            if (string.IsNullOrEmpty(userRoleClaim))
            {
                context.Result = new ForbidResult();
                return;
            }

            if (!Enum.TryParse<UserRole>(userRoleClaim, out var userRole) || 
                !_allowedRoles.Contains(userRole))
            {
                context.Result = new ForbidResult();
            }
        }
    }
}


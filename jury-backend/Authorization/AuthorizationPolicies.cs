using JuryApi.Entities;
using Microsoft.AspNetCore.Authorization;

namespace JuryApi.Authorization
{
    public static class AuthorizationPolicies
    {
        public const string RequireJury = "RequireJury";
        public const string RequireEmployee = "RequireEmployee";
        public const string RequireJuryOrEmployee = "RequireJuryOrEmployee";

        public static void ConfigurePolicies(AuthorizationOptions options)
        {
            options.AddPolicy(RequireJury, policy =>
                policy.RequireAssertion(context =>
                    context.User.HasClaim(c => c.Type == "role" && c.Value == UserRole.JURY.ToString())));

            options.AddPolicy(RequireEmployee, policy =>
                policy.RequireAssertion(context =>
                    context.User.HasClaim(c => c.Type == "role" && c.Value == UserRole.EMPLOYEE.ToString())));

            options.AddPolicy(RequireJuryOrEmployee, policy =>
                policy.RequireAssertion(context =>
                    context.User.HasClaim(c => c.Type == "role" && 
                        (c.Value == UserRole.JURY.ToString() || c.Value == UserRole.EMPLOYEE.ToString()))));
        }
    }
}


using System.Linq;
using Microsoft.AspNetCore.Authorization;
using JuryApi.Entities;

namespace JuryApi.Attributes
{
    public class AuthorizeRoleAttribute : AuthorizeAttribute
    {
        public AuthorizeRoleAttribute(params UserRole[] roles)
        {
            Roles = string.Join(",", roles.Select(r => r.ToString()));
        }
    }
}
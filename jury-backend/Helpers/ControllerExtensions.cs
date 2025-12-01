using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace JuryApi.Helpers
{
    public static class ControllerExtensions
    {
        /// <summary>
        /// Gets the current user ID from JWT claims
        /// </summary>
        public static Guid? GetCurrentUserId(this ControllerBase controller)
        {
            var userIdClaim = controller.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? controller.User?.FindFirst("sub")?.Value
                ?? controller.User?.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return null;
            }

            return userId;
        }
    }
}


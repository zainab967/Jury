using System.ComponentModel.DataAnnotations;
using JuryApi.Entities;

namespace JuryApi.DTOs.User
{
    public class CreateUserRequest
    {
        [Required]
        [StringLength(200, MinimumLength = 1)]
        public string Name { get; set; } = null!;

        [Required]
        [EmailAddress]
        [StringLength(200)]
        public string Email { get; set; } = null!;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = null!;

        [Required]
        public UserRole Role { get; set; }
    }
}


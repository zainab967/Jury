using System.ComponentModel.DataAnnotations;
using JuryApi.Entities;

namespace JuryApi.DTOs.User
{
    public class UpdateUserRequest
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        [StringLength(200, MinimumLength = 1)]
        public string Name { get; set; } = null!;

        [Required]
        [EmailAddress]
        [StringLength(200)]
        public string Email { get; set; } = null!;

        [StringLength(100, MinimumLength = 6)]
        public string? Password { get; set; }

        [Required]
        public UserRole Role { get; set; }
    }
}


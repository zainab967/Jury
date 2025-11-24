using System.ComponentModel.DataAnnotations;
using JuryApi.Entities;

namespace JuryApi.Models.DTOs
{
    public class UpdateUserRequest
    {
        [MaxLength(100)]
        public string? Name { get; set; }
        
        [EmailAddress]
        [MaxLength(255)]
        public string? Email { get; set; }
        
        public UserRole? Role { get; set; }
    }
}
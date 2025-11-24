using JuryApi.Entities;

namespace JuryApi.DTOs.User
{
    public class UserResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public UserRole Role { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}


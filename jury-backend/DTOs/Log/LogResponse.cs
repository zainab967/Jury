using JuryApi.DTOs.User;

namespace JuryApi.DTOs.Log
{
    public class LogResponse
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Action { get; set; } = null!;
        public string? Result { get; set; }
        public DateTime CreatedAt { get; set; }

        // Optional: Include user data when needed
        public UserResponse? User { get; set; }
    }
}


using JuryApi.DTOs.User;

namespace JuryApi.DTOs.Penalty
{
    public class PenaltyResponse
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Category { get; set; } = null!;
        public string Reason { get; set; } = null!;
        public string? Description { get; set; }
        public int Amount { get; set; }
        public string Status { get; set; } = null!;
        public DateTime Date { get; set; }
        public DateTime CreatedAt { get; set; }

        // Optional: Include user data when needed
        public UserResponse? User { get; set; }
    }
}


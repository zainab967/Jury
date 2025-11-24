using System;
using JuryApi.Entities;

namespace JuryApi.Models
{
    public class RefreshToken
    {
        public Guid Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RevokedAt { get; set; }
        public string? RevokedByIp { get; set; }
        public string? ReplacedByToken { get; set; }
    }
}
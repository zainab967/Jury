using System;

namespace JuryApi.Entities
{
    public partial class Penalty
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

        public virtual User User { get; set; } = null!;
    }
}


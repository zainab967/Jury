using System;

namespace JuryApi.Entities
{
    public partial class Expense
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public decimal TotalCollection { get; set; }
        public decimal Bill { get; set; }
        public decimal Arrears { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = null!;
        public DateTime Date { get; set; }
        public DateTime CreatedAt { get; set; }

        public virtual User User { get; set; } = null!;
    }
}

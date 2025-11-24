using System;

namespace JuryApi.Entities
{
    public partial class Log
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Action { get; set; } = null!;
        public string? Result { get; set; }
        public DateTime CreatedAt { get; set; }

        public virtual User User { get; set; } = null!;
    }
}

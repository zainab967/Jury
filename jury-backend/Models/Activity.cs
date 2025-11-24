using System;

namespace JuryApi.Entities
{
    public partial class Activity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime Date { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

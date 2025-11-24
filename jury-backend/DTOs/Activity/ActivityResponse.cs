namespace JuryApi.DTOs.Activity
{
    public class ActivityResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime Date { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}


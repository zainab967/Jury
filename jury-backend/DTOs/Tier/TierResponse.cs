namespace JuryApi.DTOs.Tier
{
    public class TierResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string CostsJson { get; set; } = null!;
    }
}


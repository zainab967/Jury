using System.ComponentModel.DataAnnotations;

namespace JuryApi.DTOs.Tier
{
    public class UpdateTierRequest
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        [StringLength(200, MinimumLength = 1)]
        public string Name { get; set; } = null!;

        [StringLength(2000)]
        public string? Description { get; set; }

        [Required]
        public string CostsJson { get; set; } = null!;
    }
}


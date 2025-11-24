using System.ComponentModel.DataAnnotations;

namespace JuryApi.Models.DTOs
{
    public class CreateTierRequest
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        [Required]
        public string CostsJson { get; set; } = string.Empty;
    }
}
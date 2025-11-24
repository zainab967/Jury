using System.ComponentModel.DataAnnotations;

namespace JuryApi.Models.DTOs
{
    public class UpdateTierRequest
    {
        [MaxLength(50)]
        public string? Name { get; set; }
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        public string? CostsJson { get; set; }
    }
}
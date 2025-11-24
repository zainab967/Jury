using System.ComponentModel.DataAnnotations;

namespace JuryApi.Models.DTOs
{
    public class UpdateActivityRequest
    {
        [MaxLength(100)]
        public string? Name { get; set; }
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        public DateTime? Date { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;

namespace JuryApi.Models.DTOs
{
    public class CreateActivityRequest
    {
        [Required]
        public Guid UserId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        [Required]
        public DateTime Date { get; set; }
    }
}
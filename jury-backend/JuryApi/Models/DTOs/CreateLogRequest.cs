using System.ComponentModel.DataAnnotations;

namespace JuryApi.Models.DTOs
{
    public class CreateLogRequest
    {
        [Required]
        public Guid UserId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Action { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Result { get; set; }
    }
}
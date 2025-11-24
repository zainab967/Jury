using System.ComponentModel.DataAnnotations;

namespace JuryApi.Models.DTOs
{
    public class CreatePenaltyRequest
    {
        [Required]
        public Guid UserId { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string Reason { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public int Amount { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "pending";
        
        [Required]
        public DateTime Date { get; set; }
    }
}
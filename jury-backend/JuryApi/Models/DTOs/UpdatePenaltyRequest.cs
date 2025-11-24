using System.ComponentModel.DataAnnotations;

namespace JuryApi.Models.DTOs
{
    public class UpdatePenaltyRequest
    {
        [MaxLength(50)]
        public string? Category { get; set; }
        
        [MaxLength(200)]
        public string? Reason { get; set; }
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        [Range(1, int.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public int? Amount { get; set; }
        
        [MaxLength(20)]
        public string? Status { get; set; }
        
        public DateTime? Date { get; set; }
    }
}
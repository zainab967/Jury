using System.ComponentModel.DataAnnotations;

namespace JuryApi.Models.DTOs
{
    public class UpdateExpenseRequest
    {
        [Range(0, int.MaxValue, ErrorMessage = "TotalCollection must be greater than or equal to 0")]
        public int? TotalCollection { get; set; }
        
        [Range(0, int.MaxValue, ErrorMessage = "Bill must be greater than or equal to 0")]
        public int? Bill { get; set; }
        
        [Range(0, int.MaxValue, ErrorMessage = "Arrears must be greater than or equal to 0")]
        public int? Arrears { get; set; }
        
        [MaxLength(50)]
        public string? Status { get; set; }
        
        [MaxLength(500)]
        public string? Notes { get; set; }
        
        public DateTime? Date { get; set; }
    }
}
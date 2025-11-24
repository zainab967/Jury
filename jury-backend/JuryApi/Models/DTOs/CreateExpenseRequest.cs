using System.ComponentModel.DataAnnotations;

namespace JuryApi.Models.DTOs
{
    public class CreateExpenseRequest
    {
        [Required]
        public Guid EmployeeId { get; set; }
        
        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "TotalCollection must be greater than or equal to 0")]
        public int TotalCollection { get; set; }
        
        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Bill must be greater than or equal to 0")]
        public int Bill { get; set; }
        
        [Range(0, int.MaxValue, ErrorMessage = "Arrears must be greater than or equal to 0")]
        public int Arrears { get; set; } = 0;
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "pending";
        
        [MaxLength(500)]
        public string? Notes { get; set; }
        
        [Required]
        public DateTime Date { get; set; }
    }
}
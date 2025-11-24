using System.ComponentModel.DataAnnotations;

namespace JuryApi.DTOs.Expense
{
    public class CreateExpenseRequest
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal TotalCollection { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Bill { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Arrears { get; set; }

        [StringLength(2000)]
        public string? Notes { get; set; }

        [Required]
        [StringLength(100)]
        public string Status { get; set; } = null!;

        public DateTime? Date { get; set; }
    }
}


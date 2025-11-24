using System.ComponentModel.DataAnnotations;

namespace JuryApi.DTOs.Penalty
{
    public class CreatePenaltyRequest
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string Category { get; set; } = null!;

        [Required]
        [StringLength(200)]
        public string Reason { get; set; } = null!;

        [StringLength(2000)]
        public string? Description { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int Amount { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = null!;

        public DateTime? Date { get; set; }
    }
}


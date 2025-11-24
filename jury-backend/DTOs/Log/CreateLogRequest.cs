using System.ComponentModel.DataAnnotations;

namespace JuryApi.DTOs.Log
{
    public class CreateLogRequest
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        [StringLength(200)]
        public string Action { get; set; } = null!;

        [StringLength(1000)]
        public string? Result { get; set; }
    }
}


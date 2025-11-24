using System.ComponentModel.DataAnnotations;

namespace JuryApi.DTOs.Activity
{
    public class CreateActivityRequest
    {
        [Required]
        [StringLength(200, MinimumLength = 1)]
        public string Name { get; set; } = null!;

        [StringLength(1000)]
        public string? Description { get; set; }

        public DateTime? Date { get; set; }
    }
}


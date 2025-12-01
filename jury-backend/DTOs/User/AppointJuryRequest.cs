using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace JuryApi.DTOs.User
{
    public class AppointJuryRequest
    {
        [Required]
        [MinLength(2, ErrorMessage = "You must select at least 2 users.")]
        [MaxLength(3, ErrorMessage = "You can select at most 3 users.")]
        public List<Guid> UserIds { get; set; } = new();
    }
}


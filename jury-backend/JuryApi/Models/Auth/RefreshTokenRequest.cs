using System.ComponentModel.DataAnnotations;

namespace JuryApi.Models.Auth
{
    public class RefreshTokenRequest
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
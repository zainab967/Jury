using System;

namespace JuryApi.Options
{
    public class AuthOptions
    {
        public const string SectionName = "Auth";

        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public string SigningKey { get; set; } = string.Empty;
        public string EncryptionKey { get; set; } = string.Empty;
        public double AllowedClockSkewMinutes { get; set; } = 2;

        public bool HasRequiredKeys =>
            !string.IsNullOrWhiteSpace(SigningKey) &&
            !string.IsNullOrWhiteSpace(EncryptionKey);

        public TimeSpan ClockSkew => TimeSpan.FromMinutes(
            AllowedClockSkewMinutes < 0 ? 0 : AllowedClockSkewMinutes);
    }
}



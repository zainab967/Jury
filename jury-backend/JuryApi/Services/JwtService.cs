using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using JuryApi.Entities;
using JuryApi.Models;
using JuryApi.Models.Auth;
using JuryApi.Options;

namespace JuryApi.Services
{
    public interface IJwtService
    {
        LoginResponse GenerateTokens(User user, string ipAddress);
        ClaimsPrincipal? ValidateToken(string token);
        RefreshToken GenerateRefreshToken(string ipAddress);
        ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
    }

    public class JwtService : IJwtService
    {
        private readonly AuthOptions _authOptions;
        private const int AccessTokenExpirationMinutes = 15;
        private const int RefreshTokenExpirationDays = 7;

        public JwtService(IOptions<AuthOptions> authOptions)
        {
            _authOptions = authOptions.Value;
        }

        public LoginResponse GenerateTokens(User user, string ipAddress)
        {
            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken(ipAddress);

            return new LoginResponse
            {
                Token = new JwtSecurityTokenHandler().WriteToken(accessToken),
                RefreshToken = refreshToken.Token,
                ExpiresAt = accessToken.ValidTo,
                User = new UserDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt
                }
            };
        }

        private JwtSecurityToken GenerateAccessToken(User user)
        {
            var signingKey = CreateSymmetricSecurityKey(_authOptions.SigningKey, nameof(_authOptions.SigningKey));
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Name),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role.ToString()),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                    new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
                }),
                Expires = DateTime.UtcNow.AddMinutes(AccessTokenExpirationMinutes),
                SigningCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256Signature),
                Issuer = _authOptions.Issuer,
                Audience = _authOptions.Audience
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            return tokenHandler.CreateJwtSecurityToken(tokenDescriptor);
        }

        private SymmetricSecurityKey CreateSymmetricSecurityKey(string base64Key, string keyName)
        {
            if (string.IsNullOrWhiteSpace(base64Key))
            {
                throw new InvalidOperationException($"Auth configuration '{keyName}' is missing.");
            }

            try
            {
                return new SymmetricSecurityKey(Convert.FromBase64String(base64Key));
            }
            catch (FormatException ex)
            {
                throw new InvalidOperationException($"Auth configuration '{keyName}' must be a valid Base64 string.", ex);
            }
        }

        public RefreshToken GenerateRefreshToken(string ipAddress)
        {
            using var rngCryptoServiceProvider = RandomNumberGenerator.Create();
            var randomBytes = new byte[64];
            rngCryptoServiceProvider.GetBytes(randomBytes);

            return new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = Convert.ToBase64String(randomBytes),
                ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenExpirationDays),
                CreatedAt = DateTime.UtcNow
            };
        }

        public ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                var signingKey = CreateSymmetricSecurityKey(_authOptions.SigningKey, nameof(_authOptions.SigningKey));
                var tokenHandler = new JwtSecurityTokenHandler();

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = signingKey,
                    ValidateIssuer = !string.IsNullOrWhiteSpace(_authOptions.Issuer),
                    ValidIssuer = _authOptions.Issuer,
                    ValidateAudience = !string.IsNullOrWhiteSpace(_authOptions.Audience),
                    ValidAudience = _authOptions.Audience,
                    ValidateLifetime = true,
                    ClockSkew = _authOptions.ClockSkew
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                return principal;
            }
            catch
            {
                return null;
            }
        }

        public ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var signingKey = CreateSymmetricSecurityKey(_authOptions.SigningKey, nameof(_authOptions.SigningKey));
            var tokenHandler = new JwtSecurityTokenHandler();

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = signingKey,
                ValidateIssuer = !string.IsNullOrWhiteSpace(_authOptions.Issuer),
                ValidIssuer = _authOptions.Issuer,
                ValidateAudience = !string.IsNullOrWhiteSpace(_authOptions.Audience),
                ValidAudience = _authOptions.Audience,
                ValidateLifetime = false // Don't validate lifetime for refresh token scenarios
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            if (validatedToken is not JwtSecurityToken jwtToken || 
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                throw new SecurityTokenException("Invalid token");
            }

            return principal;
        }
    }
}
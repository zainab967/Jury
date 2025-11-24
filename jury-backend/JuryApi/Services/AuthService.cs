using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using JuryApi.Data;
using JuryApi.Entities;
using JuryApi.Models;
using JuryApi.Models.Auth;

namespace JuryApi.Services
{
    public interface IAuthService
    {
        Task<LoginResponse?> LoginAsync(LoginRequest request, string ipAddress);
        Task<User?> RegisterAsync(RegisterRequest request);
        Task<LoginResponse?> RefreshTokenAsync(string token, string ipAddress);
        Task<bool> RevokeTokenAsync(string token, string ipAddress);
        Task<User?> GetUserByIdAsync(Guid userId);
    }

    public class AuthService : IAuthService
    {
        private readonly JuryDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<AuthService> _logger;

        public AuthService(JuryDbContext context, IJwtService jwtService, IPasswordHasher passwordHasher, ILogger<AuthService> logger)
        {
            _context = context;
            _jwtService = jwtService;
            _passwordHasher = passwordHasher;
            _logger = logger;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request, string ipAddress)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                return null;
            }

            var loginResponse = _jwtService.GenerateTokens(user, ipAddress);
            
            // Save refresh token to database (optional - if table doesn't exist, login still works)
            // Database-first approach: RefreshTokens table may not exist, so we make this non-blocking
            try
            {
                var refreshToken = new RefreshToken
                {
                    Id = Guid.NewGuid(),
                    Token = loginResponse.RefreshToken,
                    UserId = user.Id,
                    ExpiresAt = DateTime.UtcNow.AddDays(7), // 7 days from now
                    CreatedAt = DateTime.UtcNow
                };

                _context.RefreshTokens.Add(refreshToken);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException dbEx)
            {
                // Log warning but don't block login - JWT access token will still work
                // Only refresh token functionality will be unavailable
                _logger.LogWarning(dbEx, 
                    "Failed to save refresh token for user {UserId}. " +
                    "RefreshTokens table may not exist (database-first approach). " +
                    "Login will proceed, but token refresh functionality will be unavailable.", 
                    user.Id);
                
                // Don't throw - allow login to succeed without refresh token storage
                // The JWT access token will still work for authentication
            }
            catch (Exception ex)
            {
                // Catch any other exceptions (e.g., table doesn't exist)
                _logger.LogWarning(ex, 
                    "Failed to save refresh token for user {UserId}. " +
                    "Login will proceed without refresh token storage.", 
                    user.Id);
                // Don't throw - allow login to succeed
            }

            return loginResponse;
        }

        public async Task<User?> RegisterAsync(RegisterRequest request)
        {
            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return null;
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                Role = request.Role,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<LoginResponse?> RefreshTokenAsync(string token, string ipAddress)
        {
            var refreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == token);

            if (refreshToken == null || 
                refreshToken.IsRevoked || 
                refreshToken.ExpiresAt < DateTime.UtcNow)
            {
                return null;
            }

            // Revoke old token
            refreshToken.IsRevoked = true;
            refreshToken.RevokedAt = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;

            // Generate new tokens
            var loginResponse = _jwtService.GenerateTokens(refreshToken.User, ipAddress);
            
            // Save new refresh token
            var newRefreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = loginResponse.RefreshToken,
                UserId = refreshToken.UserId,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            };

            refreshToken.ReplacedByToken = newRefreshToken.Token;
            _context.RefreshTokens.Add(newRefreshToken);
            await _context.SaveChangesAsync();

            return loginResponse;
        }

        public async Task<bool> RevokeTokenAsync(string token, string ipAddress)
        {
            var refreshToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == token);

            if (refreshToken == null || refreshToken.IsRevoked)
            {
                return false;
            }

            refreshToken.IsRevoked = true;
            refreshToken.RevokedAt = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<User?> GetUserByIdAsync(Guid userId)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId);
        }
    }
}
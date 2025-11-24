using JuryApi.Models.Auth;
using JuryApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JuryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var ipAddress = GetClientIpAddress();
            var response = await _authService.LoginAsync(request, ipAddress);

            if (response == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            return Ok(response);
        }

        [HttpPost("register")]
        public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var user = await _authService.RegisterAsync(request);

            if (user == null)
            {
                return Conflict(new { message = "Email address is already registered" });
            }

            // Automatically log in the user after registration
            var ipAddress = GetClientIpAddress();
            var loginResponse = await _authService.LoginAsync(new LoginRequest
            {
                Email = request.Email,
                Password = request.Password
            }, ipAddress);

            return CreatedAtAction(nameof(Login), loginResponse);
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<LoginResponse>> Refresh([FromBody] RefreshTokenRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var ipAddress = GetClientIpAddress();
            var response = await _authService.RefreshTokenAsync(request.RefreshToken, ipAddress);

            if (response == null)
            {
                return Unauthorized(new { message = "Invalid or expired refresh token" });
            }

            return Ok(response);
        }

        [HttpPost("revoke")]
        [Authorize]
        public async Task<ActionResult> Revoke([FromBody] RefreshTokenRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var ipAddress = GetClientIpAddress();
            var success = await _authService.RevokeTokenAsync(request.RefreshToken, ipAddress);

            if (!success)
            {
                return BadRequest(new { message = "Invalid refresh token" });
            }

            return NoContent();
        }

        private string GetClientIpAddress()
        {
            var ipAddress = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (string.IsNullOrEmpty(ipAddress))
            {
                ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            }
            return ipAddress;
        }
    }
}


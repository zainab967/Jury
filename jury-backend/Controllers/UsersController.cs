using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using JuryApi.Attributes;
using JuryApi.Data;
using JuryApi.DTOs.Common;
using JuryApi.DTOs.User;
using JuryApi.Entities;
using JuryApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JuryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly JuryDbContext _context;
        private readonly IPasswordHasher _passwordHasher;

        public UsersController(JuryDbContext context, IPasswordHasher passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<UserResponse>>> GetUsers(
            [FromQuery] PaginationQuery pagination,
            CancellationToken cancellationToken)
        {
            var query = _context.Users
                .AsNoTracking()
                .OrderBy(u => u.Name);

            var totalCount = await query.CountAsync(cancellationToken);

            var users = await query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(u => new UserResponse
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<UserResponse>
            {
                Items = users,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
                TotalCount = totalCount
            };

            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<UserResponse>> GetUser(Guid id, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == id)
                .Select(u => new UserResponse
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return NotFound();
            }

            return Ok(user);
        }

        [HttpPost]
        [RequireRole(UserRole.JURY)]
        public async Task<ActionResult<UserResponse>> CreateUser([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email, cancellationToken))
            {
                ModelState.AddModelError(nameof(request.Email), "Email address is already registered.");
                return ValidationProblem(ModelState);
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
            await _context.SaveChangesAsync(cancellationToken);

            var response = new UserResponse
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, response);
        }

        [HttpPut("{id:guid}")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("Identifier mismatch between route and payload.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

            if (user is null)
            {
                return NotFound();
            }

            if (!string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase) &&
                await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != id, cancellationToken))
            {
                ModelState.AddModelError(nameof(request.Email), "Email address is already registered.");
                return ValidationProblem(ModelState);
            }

            user.Name = request.Name;
            user.Email = request.Email;
            user.Role = request.Role;

            // Only update password if provided
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.PasswordHash = _passwordHasher.HashPassword(request.Password);
            }

            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

            if (user is null)
            {
                return NotFound();
            }

            // Delete related entities first to avoid foreign key constraint issues
            var expenses = await _context.Expenses
                .Where(e => e.UserId == id)
                .ToListAsync(cancellationToken);
            _context.Expenses.RemoveRange(expenses);

            var penalties = await _context.Penalties
                .Where(p => p.UserId == id)
                .ToListAsync(cancellationToken);
            _context.Penalties.RemoveRange(penalties);

            var logs = await _context.Logs
                .Where(l => l.UserId == id)
                .ToListAsync(cancellationToken);
            _context.Logs.RemoveRange(logs);

            // Now delete the user
            _context.Users.Remove(user);
            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [HttpPost("appoint-jury")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> AppointJury([FromBody] AppointJuryRequest request, CancellationToken cancellationToken)
        {
            // Validate request
            if (request.UserIds == null || request.UserIds.Count < 2 || request.UserIds.Count > 3)
            {
                ModelState.AddModelError(nameof(request.UserIds), "You must select between 2 and 3 users.");
                return ValidationProblem(ModelState);
            }

            // Check for duplicate IDs
            if (request.UserIds.Distinct().Count() != request.UserIds.Count)
            {
                ModelState.AddModelError(nameof(request.UserIds), "Duplicate user IDs are not allowed.");
                return ValidationProblem(ModelState);
            }

            // Verify all selected users exist
            var selectedUsers = await _context.Users
                .Where(u => request.UserIds.Contains(u.Id))
                .ToListAsync(cancellationToken);

            if (selectedUsers.Count != request.UserIds.Count)
            {
                var missingIds = request.UserIds.Except(selectedUsers.Select(u => u.Id)).ToList();
                ModelState.AddModelError(nameof(request.UserIds), $"One or more selected users do not exist. Missing IDs: {string.Join(", ", missingIds)}");
                return ValidationProblem(ModelState);
            }

            // Use transaction to ensure atomicity
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // Step 1: Set all current JURY users to EMPLOYEE
                var currentJuryUsers = await _context.Users
                    .Where(u => u.Role == UserRole.JURY)
                    .ToListAsync(cancellationToken);

                foreach (var juryUser in currentJuryUsers)
                {
                    juryUser.Role = UserRole.EMPLOYEE;
                }

                // Step 2: Set selected users to JURY
                foreach (var selectedUser in selectedUsers)
                {
                    selectedUser.Role = UserRole.JURY;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return Ok(new { message = "Jury members have been successfully appointed." });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
    }
}


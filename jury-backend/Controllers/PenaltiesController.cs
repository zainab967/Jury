using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using JuryApi.Data;
using JuryApi.DTOs.Common;
using JuryApi.DTOs.Penalty;
using JuryApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JuryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PenaltiesController : ControllerBase
    {
        private readonly JuryDbContext _context;

        public PenaltiesController(JuryDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<PenaltyResponse>>> GetPenalties(
            [FromQuery] Guid? userId,
            [FromQuery] PaginationQuery pagination,
            CancellationToken cancellationToken)
        {
            var query = _context.Penalties
                .Include(p => p.User)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(p => p.UserId == userId.Value);
            }

            var orderedQuery = query
                .OrderByDescending(p => p.Date)
                .ThenByDescending(p => p.CreatedAt);

            var totalCount = await orderedQuery.CountAsync(cancellationToken);

            var penalties = await orderedQuery
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(p => new PenaltyResponse
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    Category = p.Category,
                    Reason = p.Reason,
                    Description = p.Description,
                    Amount = p.Amount,
                    Status = p.Status,
                    Date = p.Date,
                    CreatedAt = p.CreatedAt,
                    User = p.User != null ? new DTOs.User.UserResponse
                    {
                        Id = p.User.Id,
                        Name = p.User.Name,
                        Email = p.User.Email,
                        Role = p.User.Role,
                        CreatedAt = p.User.CreatedAt
                    } : null
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<PenaltyResponse>
            {
                Items = penalties,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
                TotalCount = totalCount
            };

            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<PenaltyResponse>> GetPenalty(Guid id, CancellationToken cancellationToken)
        {
            var penalty = await _context.Penalties
                .Include(p => p.User)
                .AsNoTracking()
                .Where(p => p.Id == id)
                .Select(p => new PenaltyResponse
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    Category = p.Category,
                    Reason = p.Reason,
                    Description = p.Description,
                    Amount = p.Amount,
                    Status = p.Status,
                    Date = p.Date,
                    CreatedAt = p.CreatedAt,
                    User = p.User != null ? new DTOs.User.UserResponse
                    {
                        Id = p.User.Id,
                        Name = p.User.Name,
                        Email = p.User.Email,
                        Role = p.User.Role,
                        CreatedAt = p.User.CreatedAt
                    } : null
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (penalty is null)
            {
                return NotFound();
            }

            return Ok(penalty);
        }

        [HttpPost]
        public async Task<ActionResult<PenaltyResponse>> CreatePenalty([FromBody] CreatePenaltyRequest request, CancellationToken cancellationToken)
        {
            if (!await _context.Users.AnyAsync(u => u.Id == request.UserId, cancellationToken))
            {
                ModelState.AddModelError(nameof(request.UserId), $"User '{request.UserId}' was not found.");
                return ValidationProblem(ModelState);
            }

            var penalty = new Penalty
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Category = request.Category,
                Reason = request.Reason,
                Description = request.Description,
                Amount = request.Amount,
                Status = request.Status,
                Date = request.Date ?? DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Penalties.Add(penalty);
            await _context.SaveChangesAsync(cancellationToken);

            var response = new PenaltyResponse
            {
                Id = penalty.Id,
                UserId = penalty.UserId,
                Category = penalty.Category,
                Reason = penalty.Reason,
                Description = penalty.Description,
                Amount = penalty.Amount,
                Status = penalty.Status,
                Date = penalty.Date,
                CreatedAt = penalty.CreatedAt
            };

            return CreatedAtAction(nameof(GetPenalty), new { id = penalty.Id }, response);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdatePenalty(Guid id, [FromBody] UpdatePenaltyRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("Identifier mismatch between route and payload.");
            }

            var penalty = await _context.Penalties.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

            if (penalty is null)
            {
                return NotFound();
            }

            if (!await _context.Users.AnyAsync(u => u.Id == request.UserId, cancellationToken))
            {
                ModelState.AddModelError(nameof(request.UserId), $"User '{request.UserId}' was not found.");
                return ValidationProblem(ModelState);
            }

            penalty.Category = request.Category;
            penalty.Reason = request.Reason;
            penalty.Description = request.Description;
            penalty.Status = request.Status;
            penalty.Amount = request.Amount;
            penalty.Date = request.Date;
            penalty.UserId = request.UserId;

            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeletePenalty(Guid id, CancellationToken cancellationToken)
        {
            var penalty = await _context.Penalties.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

            if (penalty is null)
            {
                return NotFound();
            }

            _context.Penalties.Remove(penalty);
            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }
    }
}


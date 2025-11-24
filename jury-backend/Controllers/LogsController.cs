using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using JuryApi.Data;
using JuryApi.DTOs.Common;
using JuryApi.DTOs.Log;
using JuryApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JuryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LogsController : ControllerBase
    {
        private readonly JuryDbContext _context;

        public LogsController(JuryDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<LogResponse>>> GetLogs(
            [FromQuery] Guid? userId,
            [FromQuery] PaginationQuery pagination,
            CancellationToken cancellationToken)
        {
            var query = _context.Logs
                .Include(l => l.User)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(l => l.UserId == userId.Value);
            }

            var orderedQuery = query
                .OrderByDescending(l => l.CreatedAt);

            var totalCount = await orderedQuery.CountAsync(cancellationToken);

            var logs = await orderedQuery
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(l => new LogResponse
                {
                    Id = l.Id,
                    UserId = l.UserId,
                    Action = l.Action,
                    Result = l.Result,
                    CreatedAt = l.CreatedAt,
                    User = l.User != null ? new DTOs.User.UserResponse
                    {
                        Id = l.User.Id,
                        Name = l.User.Name,
                        Email = l.User.Email,
                        Role = l.User.Role,
                        CreatedAt = l.User.CreatedAt
                    } : null
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<LogResponse>
            {
                Items = logs,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
                TotalCount = totalCount
            };

            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<LogResponse>> GetLog(Guid id, CancellationToken cancellationToken)
        {
            var log = await _context.Logs
                .Include(l => l.User)
                .AsNoTracking()
                .Where(l => l.Id == id)
                .Select(l => new LogResponse
                {
                    Id = l.Id,
                    UserId = l.UserId,
                    Action = l.Action,
                    Result = l.Result,
                    CreatedAt = l.CreatedAt,
                    User = l.User != null ? new DTOs.User.UserResponse
                    {
                        Id = l.User.Id,
                        Name = l.User.Name,
                        Email = l.User.Email,
                        Role = l.User.Role,
                        CreatedAt = l.User.CreatedAt
                    } : null
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (log is null)
            {
                return NotFound();
            }

            return Ok(log);
        }

        [HttpPost]
        public async Task<ActionResult<LogResponse>> CreateLog([FromBody] CreateLogRequest request, CancellationToken cancellationToken)
        {
            if (!await _context.Users.AnyAsync(u => u.Id == request.UserId, cancellationToken))
            {
                ModelState.AddModelError(nameof(request.UserId), $"User '{request.UserId}' was not found.");
                return ValidationProblem(ModelState);
            }

            var log = new Log
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Action = request.Action,
                Result = request.Result,
                CreatedAt = DateTime.UtcNow
            };

            _context.Logs.Add(log);
            await _context.SaveChangesAsync(cancellationToken);

            var response = new LogResponse
            {
                Id = log.Id,
                UserId = log.UserId,
                Action = log.Action,
                Result = log.Result,
                CreatedAt = log.CreatedAt
            };

            return CreatedAtAction(nameof(GetLog), new { id = log.Id }, response);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateLog(Guid id, [FromBody] UpdateLogRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("Identifier mismatch between route and payload.");
            }

            var log = await _context.Logs.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

            if (log is null)
            {
                return NotFound();
            }

            if (!await _context.Users.AnyAsync(u => u.Id == request.UserId, cancellationToken))
            {
                ModelState.AddModelError(nameof(request.UserId), $"User '{request.UserId}' was not found.");
                return ValidationProblem(ModelState);
            }

            log.UserId = request.UserId;
            log.Action = request.Action;
            log.Result = request.Result;

            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteLog(Guid id, CancellationToken cancellationToken)
        {
            var log = await _context.Logs.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

            if (log is null)
            {
                return NotFound();
            }

            _context.Logs.Remove(log);
            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }
    }
}


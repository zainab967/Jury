using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using JuryApi.Attributes;
using JuryApi.Data;
using JuryApi.DTOs.Activity;
using JuryApi.DTOs.Common;
using JuryApi.Entities;
using JuryApi.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JuryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ActivitiesController : ControllerBase
    {
        private readonly JuryDbContext _context;

        public ActivitiesController(JuryDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<ActivityResponse>>> GetActivities(
            [FromQuery] PaginationQuery pagination,
            CancellationToken cancellationToken)
        {
            var query = _context.Activities
                .AsNoTracking()
                .OrderByDescending(a => a.Date)
                .ThenByDescending(a => a.CreatedAt);

            var totalCount = await query.CountAsync(cancellationToken);

            var activities = await query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(a => new ActivityResponse
                {
                    Id = a.Id,
                    Name = a.Name,
                    Description = a.Description,
                    Date = a.Date,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<ActivityResponse>
            {
                Items = activities,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
                TotalCount = totalCount
            };

            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ActivityResponse>> GetActivity(Guid id, CancellationToken cancellationToken)
        {
            var activity = await _context.Activities
                .AsNoTracking()
                .Where(a => a.Id == id)
                .Select(a => new ActivityResponse
                {
                    Id = a.Id,
                    Name = a.Name,
                    Description = a.Description,
                    Date = a.Date,
                    CreatedAt = a.CreatedAt
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (activity is null)
            {
                return NotFound();
            }

            return Ok(activity);
        }

        [HttpPost]
        public async Task<ActionResult<ActivityResponse>> CreateActivity([FromBody] CreateActivityRequest request, CancellationToken cancellationToken)
        {
            var activity = new Activity
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                Date = request.Date ?? DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Activities.Add(activity);
            await _context.SaveChangesAsync(cancellationToken);

            var response = new ActivityResponse
            {
                Id = activity.Id,
                Name = activity.Name,
                Description = activity.Description,
                Date = activity.Date,
                CreatedAt = activity.CreatedAt
            };

            return CreatedAtAction(nameof(GetActivity), new { id = activity.Id }, response);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateActivity(Guid id, [FromBody] UpdateActivityRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("Identifier mismatch between route and payload.");
            }

            var activity = await _context.Activities.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

            if (activity is null)
            {
                return NotFound();
            }

            activity.Name = request.Name;
            activity.Description = request.Description;
            activity.Date = request.Date;

            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteActivity(Guid id, CancellationToken cancellationToken)
        {
            // Use IgnoreQueryFilters to include soft-deleted records for checking
            var activity = await _context.Activities
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

            if (activity is null || activity.IsDeleted)
            {
                return NotFound();
            }

            // Soft delete
            activity.IsDeleted = true;
            activity.DeletedAt = DateTime.UtcNow;
            activity.DeletedBy = this.GetCurrentUserId();

            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [HttpPost("{id:guid}/restore")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> RestoreActivity(Guid id, CancellationToken cancellationToken)
        {
            // Use IgnoreQueryFilters to find soft-deleted records
            var activity = await _context.Activities
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

            if (activity is null)
            {
                return NotFound();
            }

            if (!activity.IsDeleted)
            {
                return BadRequest("Activity is not deleted.");
            }

            // Restore
            activity.IsDeleted = false;
            activity.DeletedAt = null;
            activity.DeletedBy = null;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Activity restored successfully." });
        }
    }
}


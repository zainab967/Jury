using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using JuryApi.Attributes;
using JuryApi.Data;
using JuryApi.DTOs.Common;
using JuryApi.DTOs.Tier;
using JuryApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JuryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TiersController : ControllerBase
    {
        private readonly JuryDbContext _context;

        public TiersController(JuryDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<TierResponse>>> GetTiers(
            [FromQuery] PaginationQuery pagination,
            CancellationToken cancellationToken)
        {
            var query = _context.Tiers
                .AsNoTracking()
                .OrderBy(t => t.Name);

            var totalCount = await query.CountAsync(cancellationToken);

            var tiers = await query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(t => new TierResponse
                {
                    Id = t.Id,
                    Name = t.Name,
                    Description = t.Description,
                    CostsJson = t.CostsJson
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<TierResponse>
            {
                Items = tiers,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
                TotalCount = totalCount
            };

            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<TierResponse>> GetTier(Guid id, CancellationToken cancellationToken)
        {
            var tier = await _context.Tiers
                .AsNoTracking()
                .Where(t => t.Id == id)
                .Select(t => new TierResponse
                {
                    Id = t.Id,
                    Name = t.Name,
                    Description = t.Description,
                    CostsJson = t.CostsJson
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (tier is null)
            {
                return NotFound();
            }

            return Ok(tier);
        }

        [HttpPost]
        [RequireRole(UserRole.JURY)]
        public async Task<ActionResult<TierResponse>> CreateTier([FromBody] CreateTierRequest request, CancellationToken cancellationToken)
        {
            if (await _context.Tiers.AnyAsync(t => t.Name == request.Name, cancellationToken))
            {
                ModelState.AddModelError(nameof(request.Name), "A tier with the same name already exists.");
                return ValidationProblem(ModelState);
            }

            var tier = new Tier
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                CostsJson = request.CostsJson
            };

            _context.Tiers.Add(tier);
            await _context.SaveChangesAsync(cancellationToken);

            var response = new TierResponse
            {
                Id = tier.Id,
                Name = tier.Name,
                Description = tier.Description,
                CostsJson = tier.CostsJson
            };

            return CreatedAtAction(nameof(GetTier), new { id = tier.Id }, response);
        }

        [HttpPut("{id:guid}")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> UpdateTier(Guid id, [FromBody] UpdateTierRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("Identifier mismatch between route and payload.");
            }

            var tier = await _context.Tiers.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

            if (tier is null)
            {
                return NotFound();
            }

            if (!string.Equals(tier.Name, request.Name, StringComparison.OrdinalIgnoreCase) &&
                await _context.Tiers.AnyAsync(t => t.Name == request.Name && t.Id != id, cancellationToken))
            {
                ModelState.AddModelError(nameof(request.Name), "A tier with the same name already exists.");
                return ValidationProblem(ModelState);
            }

            tier.Name = request.Name;
            tier.Description = request.Description;
            tier.CostsJson = request.CostsJson;

            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> DeleteTier(Guid id, CancellationToken cancellationToken)
        {
            var tier = await _context.Tiers.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

            if (tier is null)
            {
                return NotFound();
            }

            _context.Tiers.Remove(tier);
            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }
    }
}


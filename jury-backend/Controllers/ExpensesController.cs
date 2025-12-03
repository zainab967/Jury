using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using JuryApi.Attributes;
using JuryApi.Data;
using JuryApi.DTOs.Common;
using JuryApi.DTOs.Expense;
using JuryApi.Entities;
using JuryApi.Helpers;
using JuryApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JuryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ExpensesController : ControllerBase
    {
        private readonly JuryDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<ExpensesController> _logger;

        public ExpensesController(JuryDbContext context, IEmailService emailService, ILogger<ExpensesController> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<ExpenseResponse>>> GetExpenses(
            [FromQuery] Guid? userId,
            [FromQuery] PaginationQuery pagination,
            CancellationToken cancellationToken)
        {
            var query = _context.Expenses
                .Include(e => e.User)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(e => e.UserId == userId.Value);
            }

            var orderedQuery = query
                .OrderByDescending(e => e.Date)
                .ThenByDescending(e => e.CreatedAt);

            var totalCount = await orderedQuery.CountAsync(cancellationToken);

            var expenses = await orderedQuery
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(e => new ExpenseResponse
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    TotalCollection = e.TotalCollection,
                    Bill = e.Bill,
                    Arrears = e.Arrears,
                    Notes = e.Notes,
                    Status = e.Status,
                    Date = e.Date,
                    CreatedAt = e.CreatedAt,
                    User = e.User != null ? new DTOs.User.UserResponse
                    {
                        Id = e.User.Id,
                        Name = e.User.Name,
                        Email = e.User.Email,
                        Role = e.User.Role,
                        CreatedAt = e.User.CreatedAt
                    } : null
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<ExpenseResponse>
            {
                Items = expenses,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
                TotalCount = totalCount
            };

            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ExpenseResponse>> GetExpense(Guid id, CancellationToken cancellationToken)
        {
            var expense = await _context.Expenses
                .Include(e => e.User)
                .AsNoTracking()
                .Where(e => e.Id == id)
                .Select(e => new ExpenseResponse
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    TotalCollection = e.TotalCollection,
                    Bill = e.Bill,
                    Arrears = e.Arrears,
                    Notes = e.Notes,
                    Status = e.Status,
                    Date = e.Date,
                    CreatedAt = e.CreatedAt,
                    User = e.User != null ? new DTOs.User.UserResponse
                    {
                        Id = e.User.Id,
                        Name = e.User.Name,
                        Email = e.User.Email,
                        Role = e.User.Role,
                        CreatedAt = e.User.CreatedAt
                    } : null
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (expense is null)
            {
                return NotFound();
            }

            return Ok(expense);
        }

        [HttpPost]
        public async Task<ActionResult<ExpenseResponse>> CreateExpense([FromBody] CreateExpenseRequest request, CancellationToken cancellationToken)
        {
            if (request == null)
            {
                return BadRequest(new { error = "Request body is required." });
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
            if (user == null)
            {
                ModelState.AddModelError(nameof(request.UserId), $"User '{request.UserId}' was not found.");
                return ValidationProblem(ModelState);
            }

            var expense = new Expense
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                TotalCollection = request.TotalCollection,
                Bill = request.Bill,
                Arrears = request.Arrears,
                Notes = request.Notes,
                Status = request.Status,
                Date = request.Date ?? DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync(cancellationToken);

            // Send email notification asynchronously (fire and forget)
            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendExpenseAddedNotificationAsync(
                        user.Email,
                        user.Name,
                        expense.TotalCollection,
                        expense.Bill,
                        expense.Arrears);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send expense notification email to {Email}", user.Email);
                }
            }, cancellationToken);

            var response = new ExpenseResponse
            {
                Id = expense.Id,
                UserId = expense.UserId,
                TotalCollection = expense.TotalCollection,
                Bill = expense.Bill,
                Arrears = expense.Arrears,
                Notes = expense.Notes,
                Status = expense.Status,
                Date = expense.Date,
                CreatedAt = expense.CreatedAt
            };

            return CreatedAtAction(nameof(GetExpense), new { id = expense.Id }, response);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateExpense(Guid id, [FromBody] UpdateExpenseRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("Identifier mismatch between route and payload.");
            }

            var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (expense is null)
            {
                return NotFound();
            }

            if (!await _context.Users.AnyAsync(u => u.Id == request.UserId, cancellationToken))
            {
                ModelState.AddModelError(nameof(request.UserId), $"User '{request.UserId}' was not found.");
                return ValidationProblem(ModelState);
            }

            expense.UserId = request.UserId;
            expense.TotalCollection = request.TotalCollection;
            expense.Bill = request.Bill;
            expense.Arrears = request.Arrears;
            expense.Notes = request.Notes;
            expense.Status = request.Status;
            expense.Date = request.Date;

            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteExpense(Guid id, CancellationToken cancellationToken)
        {
            // Use IgnoreQueryFilters to include soft-deleted records for checking
            var expense = await _context.Expenses
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (expense is null || expense.IsDeleted)
            {
                return NotFound();
            }

            // Soft delete
            expense.IsDeleted = true;
            expense.DeletedAt = DateTime.UtcNow;
            expense.DeletedBy = this.GetCurrentUserId();

            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [HttpPost("{id:guid}/restore")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> RestoreExpense(Guid id, CancellationToken cancellationToken)
        {
            // Use IgnoreQueryFilters to find soft-deleted records
            var expense = await _context.Expenses
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (expense is null)
            {
                return NotFound();
            }

            if (!expense.IsDeleted)
            {
                return BadRequest("Expense is not deleted.");
            }

            // Restore
            expense.IsDeleted = false;
            expense.DeletedAt = null;
            expense.DeletedBy = null;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Expense restored successfully." });
        }
    }
}


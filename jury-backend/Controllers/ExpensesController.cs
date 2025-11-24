using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using JuryApi.Data;
using JuryApi.DTOs.Common;
using JuryApi.DTOs.Expense;
using JuryApi.Entities;
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

        public ExpensesController(JuryDbContext context)
        {
            _context = context;
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

            if (!await _context.Users.AnyAsync(u => u.Id == request.UserId, cancellationToken))
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
            var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (expense is null)
            {
                return NotFound();
            }

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }
    }
}


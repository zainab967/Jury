using System;
using System.Threading;
using System.Threading.Tasks;
using JuryApi.Attributes;
using JuryApi.Entities;
using JuryApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JuryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ExportController : ControllerBase
    {
        private readonly IExportService _exportService;
        private readonly ILogger<ExportController> _logger;

        public ExportController(IExportService exportService, ILogger<ExportController> logger)
        {
            _exportService = exportService;
            _logger = logger;
        }

        [HttpGet("users/csv")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> ExportUsersToCsv(CancellationToken cancellationToken)
        {
            try
            {
                var data = await _exportService.ExportUsersToCsvAsync(cancellationToken);
                var fileName = $"users_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
                return File(data, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export users to CSV");
                return StatusCode(500, new { message = "Failed to export users to CSV" });
            }
        }

        [HttpGet("users/excel")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> ExportUsersToExcel(CancellationToken cancellationToken)
        {
            try
            {
                var data = await _exportService.ExportUsersToExcelAsync(cancellationToken);
                var fileName = $"users_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export users to Excel");
                return StatusCode(500, new { message = "Failed to export users to Excel" });
            }
        }

        [HttpGet("penalties/csv")]
        public async Task<IActionResult> ExportPenaltiesToCsv([FromQuery] Guid? userId, CancellationToken cancellationToken)
        {
            try
            {
                var data = await _exportService.ExportPenaltiesToCsvAsync(userId, cancellationToken);
                var fileName = $"penalties_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
                return File(data, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export penalties to CSV");
                return StatusCode(500, new { message = "Failed to export penalties to CSV" });
            }
        }

        [HttpGet("penalties/excel")]
        public async Task<IActionResult> ExportPenaltiesToExcel([FromQuery] Guid? userId, CancellationToken cancellationToken)
        {
            try
            {
                var data = await _exportService.ExportPenaltiesToExcelAsync(userId, cancellationToken);
                var fileName = $"penalties_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export penalties to Excel");
                return StatusCode(500, new { message = "Failed to export penalties to Excel" });
            }
        }

        [HttpGet("expenses/csv")]
        public async Task<IActionResult> ExportExpensesToCsv([FromQuery] Guid? userId, CancellationToken cancellationToken)
        {
            try
            {
                var data = await _exportService.ExportExpensesToCsvAsync(userId, cancellationToken);
                var fileName = $"expenses_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
                return File(data, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export expenses to CSV");
                return StatusCode(500, new { message = "Failed to export expenses to CSV" });
            }
        }

        [HttpGet("expenses/excel")]
        public async Task<IActionResult> ExportExpensesToExcel([FromQuery] Guid? userId, CancellationToken cancellationToken)
        {
            try
            {
                var data = await _exportService.ExportExpensesToExcelAsync(userId, cancellationToken);
                var fileName = $"expenses_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export expenses to Excel");
                return StatusCode(500, new { message = "Failed to export expenses to Excel" });
            }
        }

        [HttpGet("activities/csv")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> ExportActivitiesToCsv(CancellationToken cancellationToken)
        {
            try
            {
                var data = await _exportService.ExportActivitiesToCsvAsync(cancellationToken);
                var fileName = $"activities_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
                return File(data, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export activities to CSV");
                return StatusCode(500, new { message = "Failed to export activities to CSV" });
            }
        }

        [HttpGet("activities/excel")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> ExportActivitiesToExcel(CancellationToken cancellationToken)
        {
            try
            {
                var data = await _exportService.ExportActivitiesToExcelAsync(cancellationToken);
                var fileName = $"activities_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export activities to Excel");
                return StatusCode(500, new { message = "Failed to export activities to Excel" });
            }
        }

        [HttpGet("logs/csv")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> ExportLogsToCsv([FromQuery] Guid? userId, CancellationToken cancellationToken)
        {
            try
            {
                var data = await _exportService.ExportLogsToCsvAsync(userId, cancellationToken);
                var fileName = $"logs_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
                return File(data, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export logs to CSV");
                return StatusCode(500, new { message = "Failed to export logs to CSV" });
            }
        }

        [HttpGet("logs/excel")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> ExportLogsToExcel([FromQuery] Guid? userId, CancellationToken cancellationToken)
        {
            try
            {
                var data = await _exportService.ExportLogsToExcelAsync(userId, cancellationToken);
                var fileName = $"logs_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export logs to Excel");
                return StatusCode(500, new { message = "Failed to export logs to Excel" });
            }
        }

        [HttpGet("financial-report/excel")]
        [RequireRole(UserRole.JURY)]
        public async Task<IActionResult> ExportFinancialReportToExcel(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken cancellationToken)
        {
            try
            {
                var data = await _exportService.ExportFinancialReportToExcelAsync(startDate, endDate, cancellationToken);
                var fileName = $"financial_report_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export financial report to Excel");
                return StatusCode(500, new { message = "Failed to export financial report to Excel" });
            }
        }
    }
}


using System.Globalization;
using System.Text;
using ClosedXML.Excel;
using CsvHelper;
using CsvHelper.Configuration;
using JuryApi.Data;
using JuryApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace JuryApi.Services
{
    public class ExportService : IExportService
    {
        private readonly JuryDbContext _context;
        private readonly ILogger<ExportService> _logger;

        public ExportService(JuryDbContext context, ILogger<ExportService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<byte[]> ExportUsersToCsvAsync(CancellationToken cancellationToken = default)
        {
            var users = await _context.Users
                .AsNoTracking()
                .OrderBy(u => u.Name)
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Email,
                    Role = u.Role.ToString(),
                    CreatedAt = u.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                })
                .ToListAsync(cancellationToken);

            using var memoryStream = new MemoryStream();
            using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
            using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                Delimiter = ","
            });

            csv.WriteRecords(users);
            await writer.FlushAsync();
            return memoryStream.ToArray();
        }

        public async Task<byte[]> ExportUsersToExcelAsync(CancellationToken cancellationToken = default)
        {
            var users = await _context.Users
                .AsNoTracking()
                .OrderBy(u => u.Name)
                .ToListAsync(cancellationToken);

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Users");

            // Headers
            worksheet.Cell(1, 1).Value = "ID";
            worksheet.Cell(1, 2).Value = "Name";
            worksheet.Cell(1, 3).Value = "Email";
            worksheet.Cell(1, 4).Value = "Role";
            worksheet.Cell(1, 5).Value = "Created At";

            // Style headers
            var headerRange = worksheet.Range(1, 1, 1, 5);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            // Data
            for (int i = 0; i < users.Count; i++)
            {
                var user = users[i];
                worksheet.Cell(i + 2, 1).Value = user.Id.ToString();
                worksheet.Cell(i + 2, 2).Value = user.Name;
                worksheet.Cell(i + 2, 3).Value = user.Email;
                worksheet.Cell(i + 2, 4).Value = user.Role.ToString();
                worksheet.Cell(i + 2, 5).Value = user.CreatedAt;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        public async Task<byte[]> ExportPenaltiesToCsvAsync(Guid? userId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Penalties
                .Include(p => p.User)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(p => p.UserId == userId.Value);
            }

            var penalties = await query
                .OrderByDescending(p => p.Date)
                .Select(p => new
                {
                    p.Id,
                    UserName = p.User.Name,
                    UserEmail = p.User.Email,
                    p.Category,
                    p.Reason,
                    p.Description,
                    Amount = p.Amount,
                    p.Status,
                    Date = p.Date.ToString("yyyy-MM-dd HH:mm:ss"),
                    CreatedAt = p.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                })
                .ToListAsync(cancellationToken);

            using var memoryStream = new MemoryStream();
            using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
            using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                Delimiter = ","
            });

            csv.WriteRecords(penalties);
            await writer.FlushAsync();
            return memoryStream.ToArray();
        }

        public async Task<byte[]> ExportPenaltiesToExcelAsync(Guid? userId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Penalties
                .Include(p => p.User)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(p => p.UserId == userId.Value);
            }

            var penalties = await query
                .OrderByDescending(p => p.Date)
                .ToListAsync(cancellationToken);

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Penalties");

            // Headers
            worksheet.Cell(1, 1).Value = "ID";
            worksheet.Cell(1, 2).Value = "User Name";
            worksheet.Cell(1, 3).Value = "User Email";
            worksheet.Cell(1, 4).Value = "Category";
            worksheet.Cell(1, 5).Value = "Reason";
            worksheet.Cell(1, 6).Value = "Description";
            worksheet.Cell(1, 7).Value = "Amount (PKR)";
            worksheet.Cell(1, 8).Value = "Status";
            worksheet.Cell(1, 9).Value = "Date";
            worksheet.Cell(1, 10).Value = "Created At";

            var headerRange = worksheet.Range(1, 1, 1, 10);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            for (int i = 0; i < penalties.Count; i++)
            {
                var p = penalties[i];
                worksheet.Cell(i + 2, 1).Value = p.Id.ToString();
                worksheet.Cell(i + 2, 2).Value = p.User.Name;
                worksheet.Cell(i + 2, 3).Value = p.User.Email;
                worksheet.Cell(i + 2, 4).Value = p.Category;
                worksheet.Cell(i + 2, 5).Value = p.Reason;
                worksheet.Cell(i + 2, 6).Value = p.Description ?? string.Empty;
                worksheet.Cell(i + 2, 7).Value = p.Amount;
                worksheet.Cell(i + 2, 8).Value = p.Status;
                worksheet.Cell(i + 2, 9).Value = p.Date;
                worksheet.Cell(i + 2, 10).Value = p.CreatedAt;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        public async Task<byte[]> ExportExpensesToCsvAsync(Guid? userId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Expenses
                .Include(e => e.User)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(e => e.UserId == userId.Value);
            }

            var expenses = await query
                .OrderByDescending(e => e.Date)
                .Select(e => new
                {
                    e.Id,
                    UserName = e.User.Name,
                    UserEmail = e.User.Email,
                    TotalCollection = e.TotalCollection,
                    Bill = e.Bill,
                    Arrears = e.Arrears,
                    e.Notes,
                    e.Status,
                    Date = e.Date.ToString("yyyy-MM-dd HH:mm:ss"),
                    CreatedAt = e.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                })
                .ToListAsync(cancellationToken);

            using var memoryStream = new MemoryStream();
            using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
            using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                Delimiter = ","
            });

            csv.WriteRecords(expenses);
            await writer.FlushAsync();
            return memoryStream.ToArray();
        }

        public async Task<byte[]> ExportExpensesToExcelAsync(Guid? userId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Expenses
                .Include(e => e.User)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(e => e.UserId == userId.Value);
            }

            var expenses = await query
                .OrderByDescending(e => e.Date)
                .ToListAsync(cancellationToken);

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Expenses");

            // Headers
            worksheet.Cell(1, 1).Value = "ID";
            worksheet.Cell(1, 2).Value = "User Name";
            worksheet.Cell(1, 3).Value = "User Email";
            worksheet.Cell(1, 4).Value = "Total Collection (PKR)";
            worksheet.Cell(1, 5).Value = "Bill (PKR)";
            worksheet.Cell(1, 6).Value = "Arrears (PKR)";
            worksheet.Cell(1, 7).Value = "Notes";
            worksheet.Cell(1, 8).Value = "Status";
            worksheet.Cell(1, 9).Value = "Date";
            worksheet.Cell(1, 10).Value = "Created At";

            var headerRange = worksheet.Range(1, 1, 1, 10);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            for (int i = 0; i < expenses.Count; i++)
            {
                var e = expenses[i];
                worksheet.Cell(i + 2, 1).Value = e.Id.ToString();
                worksheet.Cell(i + 2, 2).Value = e.User.Name;
                worksheet.Cell(i + 2, 3).Value = e.User.Email;
                worksheet.Cell(i + 2, 4).Value = e.TotalCollection;
                worksheet.Cell(i + 2, 5).Value = e.Bill;
                worksheet.Cell(i + 2, 6).Value = e.Arrears;
                worksheet.Cell(i + 2, 7).Value = e.Notes ?? string.Empty;
                worksheet.Cell(i + 2, 8).Value = e.Status;
                worksheet.Cell(i + 2, 9).Value = e.Date;
                worksheet.Cell(i + 2, 10).Value = e.CreatedAt;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        public async Task<byte[]> ExportActivitiesToCsvAsync(CancellationToken cancellationToken = default)
        {
            var activities = await _context.Activities
                .AsNoTracking()
                .OrderByDescending(a => a.Date)
                .Select(a => new
                {
                    a.Id,
                    a.Name,
                    a.Description,
                    Date = a.Date.ToString("yyyy-MM-dd HH:mm:ss"),
                    CreatedAt = a.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                })
                .ToListAsync(cancellationToken);

            using var memoryStream = new MemoryStream();
            using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
            using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                Delimiter = ","
            });

            csv.WriteRecords(activities);
            await writer.FlushAsync();
            return memoryStream.ToArray();
        }

        public async Task<byte[]> ExportActivitiesToExcelAsync(CancellationToken cancellationToken = default)
        {
            var activities = await _context.Activities
                .AsNoTracking()
                .OrderByDescending(a => a.Date)
                .ToListAsync(cancellationToken);

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Activities");

            // Headers
            worksheet.Cell(1, 1).Value = "ID";
            worksheet.Cell(1, 2).Value = "Name";
            worksheet.Cell(1, 3).Value = "Description";
            worksheet.Cell(1, 4).Value = "Date";
            worksheet.Cell(1, 5).Value = "Created At";

            var headerRange = worksheet.Range(1, 1, 1, 5);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            for (int i = 0; i < activities.Count; i++)
            {
                var a = activities[i];
                worksheet.Cell(i + 2, 1).Value = a.Id.ToString();
                worksheet.Cell(i + 2, 2).Value = a.Name;
                worksheet.Cell(i + 2, 3).Value = a.Description ?? string.Empty;
                worksheet.Cell(i + 2, 4).Value = a.Date;
                worksheet.Cell(i + 2, 5).Value = a.CreatedAt;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        public async Task<byte[]> ExportLogsToCsvAsync(Guid? userId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Logs
                .Include(l => l.User)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(l => l.UserId == userId.Value);
            }

            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => new
                {
                    l.Id,
                    UserName = l.User.Name,
                    UserEmail = l.User.Email,
                    l.Action,
                    l.Result,
                    CreatedAt = l.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                })
                .ToListAsync(cancellationToken);

            using var memoryStream = new MemoryStream();
            using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
            using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                Delimiter = ","
            });

            csv.WriteRecords(logs);
            await writer.FlushAsync();
            return memoryStream.ToArray();
        }

        public async Task<byte[]> ExportLogsToExcelAsync(Guid? userId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Logs
                .Include(l => l.User)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(l => l.UserId == userId.Value);
            }

            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync(cancellationToken);

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Logs");

            // Headers
            worksheet.Cell(1, 1).Value = "ID";
            worksheet.Cell(1, 2).Value = "User Name";
            worksheet.Cell(1, 3).Value = "User Email";
            worksheet.Cell(1, 4).Value = "Action";
            worksheet.Cell(1, 5).Value = "Result";
            worksheet.Cell(1, 6).Value = "Created At";

            var headerRange = worksheet.Range(1, 1, 1, 6);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            for (int i = 0; i < logs.Count; i++)
            {
                var l = logs[i];
                worksheet.Cell(i + 2, 1).Value = l.Id.ToString();
                worksheet.Cell(i + 2, 2).Value = l.User.Name;
                worksheet.Cell(i + 2, 3).Value = l.User.Email;
                worksheet.Cell(i + 2, 4).Value = l.Action;
                worksheet.Cell(i + 2, 5).Value = l.Result ?? string.Empty;
                worksheet.Cell(i + 2, 6).Value = l.CreatedAt;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        public async Task<byte[]> ExportFinancialReportToExcelAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default)
        {
            var expensesQuery = _context.Expenses
                .Include(e => e.User)
                .AsNoTracking();

            var penaltiesQuery = _context.Penalties
                .Include(p => p.User)
                .AsNoTracking();

            if (startDate.HasValue)
            {
                expensesQuery = expensesQuery.Where(e => e.Date >= startDate.Value);
                penaltiesQuery = penaltiesQuery.Where(p => p.Date >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                expensesQuery = expensesQuery.Where(e => e.Date <= endDate.Value);
                penaltiesQuery = penaltiesQuery.Where(p => p.Date <= endDate.Value);
            }

            var expenses = await expensesQuery.ToListAsync(cancellationToken);
            var penalties = await penaltiesQuery.ToListAsync(cancellationToken);

            using var workbook = new XLWorkbook();

            // Expenses Sheet
            var expensesSheet = workbook.Worksheets.Add("Expenses");
            expensesSheet.Cell(1, 1).Value = "User Name";
            expensesSheet.Cell(1, 2).Value = "Total Collection (PKR)";
            expensesSheet.Cell(1, 3).Value = "Bill (PKR)";
            expensesSheet.Cell(1, 4).Value = "Arrears (PKR)";
            expensesSheet.Cell(1, 5).Value = "Date";

            var expensesHeaderRange = expensesSheet.Range(1, 1, 1, 5);
            expensesHeaderRange.Style.Font.Bold = true;
            expensesHeaderRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            for (int i = 0; i < expenses.Count; i++)
            {
                var e = expenses[i];
                expensesSheet.Cell(i + 2, 1).Value = e.User.Name;
                expensesSheet.Cell(i + 2, 2).Value = e.TotalCollection;
                expensesSheet.Cell(i + 2, 3).Value = e.Bill;
                expensesSheet.Cell(i + 2, 4).Value = e.Arrears;
                expensesSheet.Cell(i + 2, 5).Value = e.Date;
            }

            // Summary row
            var summaryRow = expenses.Count + 3;
            expensesSheet.Cell(summaryRow, 1).Value = "TOTAL";
            expensesSheet.Cell(summaryRow, 2).Value = expenses.Sum(e => e.TotalCollection);
            expensesSheet.Cell(summaryRow, 3).Value = expenses.Sum(e => e.Bill);
            expensesSheet.Cell(summaryRow, 4).Value = expenses.Sum(e => e.Arrears);
            expensesSheet.Range(summaryRow, 1, summaryRow, 4).Style.Font.Bold = true;

            expensesSheet.Columns().AdjustToContents();

            // Penalties Sheet
            var penaltiesSheet = workbook.Worksheets.Add("Penalties");
            penaltiesSheet.Cell(1, 1).Value = "User Name";
            penaltiesSheet.Cell(1, 2).Value = "Category";
            penaltiesSheet.Cell(1, 3).Value = "Amount (PKR)";
            penaltiesSheet.Cell(1, 4).Value = "Status";
            penaltiesSheet.Cell(1, 5).Value = "Date";

            var penaltiesHeaderRange = penaltiesSheet.Range(1, 1, 1, 5);
            penaltiesHeaderRange.Style.Font.Bold = true;
            penaltiesHeaderRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            for (int i = 0; i < penalties.Count; i++)
            {
                var p = penalties[i];
                penaltiesSheet.Cell(i + 2, 1).Value = p.User.Name;
                penaltiesSheet.Cell(i + 2, 2).Value = p.Category;
                penaltiesSheet.Cell(i + 2, 3).Value = p.Amount;
                penaltiesSheet.Cell(i + 2, 4).Value = p.Status;
                penaltiesSheet.Cell(i + 2, 5).Value = p.Date;
            }

            // Summary row
            var penaltiesSummaryRow = penalties.Count + 3;
            penaltiesSheet.Cell(penaltiesSummaryRow, 1).Value = "TOTAL";
            penaltiesSheet.Cell(penaltiesSummaryRow, 3).Value = penalties.Sum(p => p.Amount);
            penaltiesSheet.Range(penaltiesSummaryRow, 1, penaltiesSummaryRow, 3).Style.Font.Bold = true;

            penaltiesSheet.Columns().AdjustToContents();

            // Summary Sheet
            var summarySheet = workbook.Worksheets.Add("Summary");
            summarySheet.Cell(1, 1).Value = "Financial Report Summary";
            summarySheet.Cell(1, 1).Style.Font.Bold = true;
            summarySheet.Cell(1, 1).Style.Font.FontSize = 14;

            summarySheet.Cell(3, 1).Value = "Total Expenses Collection:";
            summarySheet.Cell(3, 2).Value = expenses.Sum(e => e.TotalCollection);
            summarySheet.Cell(4, 1).Value = "Total Expenses Bill:";
            summarySheet.Cell(4, 2).Value = expenses.Sum(e => e.Bill);
            summarySheet.Cell(5, 1).Value = "Total Expenses Arrears:";
            summarySheet.Cell(5, 2).Value = expenses.Sum(e => e.Arrears);
            summarySheet.Cell(6, 1).Value = "Total Penalties:";
            summarySheet.Cell(6, 2).Value = penalties.Sum(p => p.Amount);
            summarySheet.Cell(7, 1).Value = "Net Collection:";
            summarySheet.Cell(7, 2).Value = expenses.Sum(e => e.TotalCollection) - expenses.Sum(e => e.Bill) - penalties.Sum(p => p.Amount);
            summarySheet.Cell(7, 2).Style.Font.Bold = true;

            if (startDate.HasValue)
            {
                summarySheet.Cell(9, 1).Value = "Report Period:";
                summarySheet.Cell(9, 2).Value = $"{startDate.Value:yyyy-MM-dd} to {(endDate ?? DateTime.UtcNow):yyyy-MM-dd}";
            }

            summarySheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }
    }
}


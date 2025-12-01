namespace JuryApi.Services
{
    public interface IExportService
    {
        Task<byte[]> ExportUsersToCsvAsync(CancellationToken cancellationToken = default);
        Task<byte[]> ExportUsersToExcelAsync(CancellationToken cancellationToken = default);
        Task<byte[]> ExportPenaltiesToCsvAsync(Guid? userId = null, CancellationToken cancellationToken = default);
        Task<byte[]> ExportPenaltiesToExcelAsync(Guid? userId = null, CancellationToken cancellationToken = default);
        Task<byte[]> ExportExpensesToCsvAsync(Guid? userId = null, CancellationToken cancellationToken = default);
        Task<byte[]> ExportExpensesToExcelAsync(Guid? userId = null, CancellationToken cancellationToken = default);
        Task<byte[]> ExportActivitiesToCsvAsync(CancellationToken cancellationToken = default);
        Task<byte[]> ExportActivitiesToExcelAsync(CancellationToken cancellationToken = default);
        Task<byte[]> ExportLogsToCsvAsync(Guid? userId = null, CancellationToken cancellationToken = default);
        Task<byte[]> ExportLogsToExcelAsync(Guid? userId = null, CancellationToken cancellationToken = default);
        Task<byte[]> ExportFinancialReportToExcelAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
    }
}


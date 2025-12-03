using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace JuryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class HealthController : ControllerBase
    {
        private readonly HealthCheckService _healthCheckService;

        public HealthController(HealthCheckService healthCheckService)
        {
            _healthCheckService = healthCheckService;
        }

        /// <summary>
        /// Get overall health status of the application
        /// </summary>
        /// <returns>Health status with all checks</returns>
        [HttpGet]
        [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> GetHealth()
        {
            var healthReport = await _healthCheckService.CheckHealthAsync();
            var response = new HealthCheckResponse
            {
                Status = healthReport.Status.ToString(),
                TotalDuration = healthReport.TotalDuration.TotalMilliseconds,
                Checks = healthReport.Entries.Select(e => new HealthCheckEntry
                {
                    Name = e.Key,
                    Status = e.Value.Status.ToString(),
                    Description = e.Value.Description,
                    Exception = e.Value.Exception?.Message,
                    Duration = e.Value.Duration.TotalMilliseconds,
                    Tags = e.Value.Tags.ToArray()
                }).ToArray()
            };

            return healthReport.Status == HealthStatus.Healthy
                ? Ok(response)
                : StatusCode(503, response);
        }

        /// <summary>
        /// Get readiness status (checks if application is ready to accept traffic)
        /// </summary>
        /// <returns>Readiness status including database connectivity</returns>
        [HttpGet("ready")]
        [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> GetReady()
        {
            var healthReport = await _healthCheckService.CheckHealthAsync(
                check => check.Tags.Contains("ready"));
            
            var response = new HealthCheckResponse
            {
                Status = healthReport.Status.ToString(),
                TotalDuration = healthReport.TotalDuration.TotalMilliseconds,
                Checks = healthReport.Entries.Select(e => new HealthCheckEntry
                {
                    Name = e.Key,
                    Status = e.Value.Status.ToString(),
                    Description = e.Value.Description,
                    Exception = e.Value.Exception?.Message,
                    Duration = e.Value.Duration.TotalMilliseconds,
                    Tags = e.Value.Tags.ToArray()
                }).ToArray()
            };

            return healthReport.Status == HealthStatus.Healthy
                ? Ok(response)
                : StatusCode(503, response);
        }

        /// <summary>
        /// Get liveness status (basic application health check)
        /// </summary>
        /// <returns>Liveness status without dependency checks</returns>
        [HttpGet("live")]
        [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> GetLive()
        {
            var healthReport = await _healthCheckService.CheckHealthAsync(
                check => check.Tags.Contains("self"));
            
            var response = new HealthCheckResponse
            {
                Status = healthReport.Status.ToString(),
                TotalDuration = healthReport.TotalDuration.TotalMilliseconds,
                Checks = healthReport.Entries.Select(e => new HealthCheckEntry
                {
                    Name = e.Key,
                    Status = e.Value.Status.ToString(),
                    Description = e.Value.Description,
                    Exception = e.Value.Exception?.Message,
                    Duration = e.Value.Duration.TotalMilliseconds,
                    Tags = e.Value.Tags.ToArray()
                }).ToArray()
            };

            return healthReport.Status == HealthStatus.Healthy
                ? Ok(response)
                : StatusCode(503, response);
        }
    }

    /// <summary>
    /// Health check response model
    /// </summary>
    public class HealthCheckResponse
    {
        /// <summary>
        /// Overall health status (Healthy, Degraded, Unhealthy)
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Total duration of all health checks in milliseconds
        /// </summary>
        public double TotalDuration { get; set; }

        /// <summary>
        /// Individual health check results
        /// </summary>
        public HealthCheckEntry[] Checks { get; set; } = Array.Empty<HealthCheckEntry>();
    }

    /// <summary>
    /// Individual health check entry
    /// </summary>
    public class HealthCheckEntry
    {
        /// <summary>
        /// Name of the health check
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Status of the health check (Healthy, Degraded, Unhealthy)
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Description of the health check result
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Exception message if the check failed
        /// </summary>
        public string? Exception { get; set; }

        /// <summary>
        /// Duration of the check in milliseconds
        /// </summary>
        public double Duration { get; set; }

        /// <summary>
        /// Tags associated with the health check
        /// </summary>
        public string[] Tags { get; set; } = Array.Empty<string>();
    }
}


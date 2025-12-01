namespace JuryApi.Options
{
    public class EmailOptions
    {
        public const string SectionName = "Email";

        public string SmtpServer { get; set; } = string.Empty;
        public int SmtpPort { get; set; } = 587;
        public string SmtpUsername { get; set; } = string.Empty;
        public string SmtpPassword { get; set; } = string.Empty;
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = "Jury Management System";
        public bool UseSsl { get; set; } = true;
        public bool Enabled { get; set; } = true;
    }
}


using System;
using System.Collections.Generic;

namespace JuryApi.Entities
{
    public enum UserRole
    {
        EMPLOYEE = 0,
        JURY = 1
    }

    public partial class User
    {
        public User()
        {
            Penalties = new HashSet<Penalty>();
            Logs = new HashSet<Log>();
            Expenses = new HashSet<Expense>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public UserRole Role { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        public virtual ICollection<Penalty> Penalties { get; set; }
        public virtual ICollection<Log> Logs { get; set; }
        public virtual ICollection<Expense> Expenses { get; set; }
    }
}

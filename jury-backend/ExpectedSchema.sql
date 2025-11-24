CREATE TABLE [Tiers] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [Description] nvarchar(2000) NULL,
    [CostsJson] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Tiers] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Users] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [Email] nvarchar(200) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [Role] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Activities] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [Description] nvarchar(1000) NULL,
    [Date] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Activities] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Expenses] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [TotalCollection] decimal(18,2) NOT NULL,
    [Bill] decimal(18,2) NOT NULL,
    [Arrears] decimal(18,2) NOT NULL,
    [Notes] nvarchar(2000) NULL,
    [Status] nvarchar(100) NOT NULL,
    [Date] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Expenses] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Expenses_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
);
GO


CREATE TABLE [Logs] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Action] nvarchar(200) NOT NULL,
    [Result] nvarchar(1000) NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Logs] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Logs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
);
GO


CREATE TABLE [Penalties] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Category] nvarchar(100) NOT NULL,
    [Reason] nvarchar(200) NOT NULL,
    [Description] nvarchar(2000) NULL,
    [Amount] int NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [Date] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Penalties] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Penalties_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
);
GO


CREATE INDEX [IX_Expenses_UserId] ON [Expenses] ([UserId]);
GO


CREATE INDEX [IX_Logs_UserId] ON [Logs] ([UserId]);
GO


CREATE INDEX [IX_Penalties_Date] ON [Penalties] ([Date]);
GO


CREATE INDEX [IX_Penalties_UserId] ON [Penalties] ([UserId]);
GO


CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
GO



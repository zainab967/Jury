# Migrations Folder

⚠️ **This project uses Database-First approach. Migrations are NOT used.**

This folder contains historical migration files for reference only.

## Do Not Use

- ❌ `dotnet ef migrations add` - Do not create new migrations
- ❌ `dotnet ef database update` - Do not apply migrations
- ❌ `dotnet ef migrations remove` - Not applicable

## Database Changes

All database schema changes should be made directly in SQL Server:
1. Use SQL Server Management Studio
2. Write and execute ALTER TABLE scripts
3. Update C# models if needed

## Current Migration Files (Reference Only)

- `20251110133026_RemoveActivityUser.cs` - Historical migration

These files are kept for reference but are not executed.


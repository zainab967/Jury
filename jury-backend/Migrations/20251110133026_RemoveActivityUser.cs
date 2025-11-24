using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JuryApi.Migrations
{
    /// <inheritdoc />
    public partial class RemoveActivityUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DECLARE @fkName sysname;
SELECT @fkName = fk.name
FROM sys.foreign_keys fk
JOIN sys.tables t ON fk.parent_object_id = t.object_id
JOIN sys.schemas s ON t.schema_id = s.schema_id
JOIN sys.tables rt ON fk.referenced_object_id = rt.object_id
JOIN sys.schemas rs ON rt.schema_id = rs.schema_id
WHERE t.name = 'Activities' AND s.name = 'dbo' AND rt.name = 'Users' AND rs.name = 'dbo';

IF @fkName IS NOT NULL
BEGIN
    EXEC(N'ALTER TABLE [dbo].[Activities] DROP CONSTRAINT [' + @fkName + N']');
END
");

            migrationBuilder.Sql(@"
DECLARE @indexName sysname;
SELECT TOP(1) @indexName = ind.name
FROM sys.indexes ind
JOIN sys.index_columns ic ON ind.object_id = ic.object_id AND ind.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
JOIN sys.tables t ON ind.object_id = t.object_id
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE t.name = 'Activities' AND s.name = 'dbo' AND c.name = 'UserId' AND ind.is_primary_key = 0;

IF @indexName IS NOT NULL
BEGIN
    EXEC(N'DROP INDEX [' + @indexName + N'] ON [dbo].[Activities]');
END
");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Activities");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Activities",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Activities_UserId",
                table: "Activities",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Activities_Users_UserId",
                table: "Activities",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}

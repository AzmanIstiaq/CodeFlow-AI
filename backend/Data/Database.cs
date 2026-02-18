/**
 * File: Database.cs
 *
 * Purpose:
 * - Manage SQLite connection creation and schema initialization.
 *
 * Controls:
 * - `Workflows` table bootstrap and lightweight migration for timestamp columns.
 *
 * Directly related files:
 * - backend/Program.cs
 * - backend/Routes/RouteRequestHelpers.cs
 */

using Microsoft.Data.Sqlite;

namespace CodeFlowBackend.Data
{
    public static class Database
    {
        private const string ConnectionString = "Data Source=workflows.db";

        /// <summary>
        /// Function Name: Initialize
        ///
        /// Purpose:
        /// Ensure required database tables/columns exist before request handling starts.
        ///
        /// How It Works:
        /// Opens SQLite, creates the Workflows table if missing, then applies additive column migrations.
        ///
        /// Parameters:
        /// - None.
        ///
        /// Returns:
        /// - void.
        ///
        /// If You Want to Modify This Behavior:
        /// - Go to: backend/Routes/WorkflowEndpoints.cs
        /// - Change: Query usage of fields introduced by schema updates.
        /// </summary>
        public static void Initialize()
        {
            using var connection = new SqliteConnection(ConnectionString);
            connection.Open();

            var command = connection.CreateCommand();
            command.CommandText =
            @"CREATE TABLE IF NOT EXISTS Workflows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                workflow TEXT NOT NULL,
                description TEXT,
                diagram TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT
            );";
            command.ExecuteNonQuery();

            // Migration: Add createdAt and updatedAt columns if they don't exist.
            try
            {
                var alterCommand = connection.CreateCommand();
                alterCommand.CommandText = @"ALTER TABLE Workflows ADD COLUMN createdAt TEXT DEFAULT CURRENT_TIMESTAMP;";
                alterCommand.ExecuteNonQuery();
            }
            catch { /* Column already exists */ }

            try
            {
                var alterCommand = connection.CreateCommand();
                alterCommand.CommandText = @"ALTER TABLE Workflows ADD COLUMN updatedAt TEXT;";
                alterCommand.ExecuteNonQuery();
            }
            catch { /* Column already exists */ }
        }

        /// <summary>
        /// Function Name: GetConnection
        ///
        /// Purpose:
        /// Create a new SQLite connection without opening it.
        ///
        /// How It Works:
        /// Returns a fresh SqliteConnection configured with the shared connection string.
        ///
        /// Parameters:
        /// - None.
        ///
        /// Returns:
        /// - SqliteConnection.
        ///
        /// If You Want to Modify This Behavior:
        /// - Go to: backend/Routes/RouteRequestHelpers.cs
        /// - Change: Open/close lifecycle behavior for endpoint handlers.
        /// </summary>
        public static SqliteConnection GetConnection()
        {
            return new SqliteConnection(ConnectionString);
        }
    }
}

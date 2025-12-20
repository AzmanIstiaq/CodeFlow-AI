using Microsoft.Data.Sqlite;

namespace CodeFlowBackend.Data
{
    public static class Database
    {
        private const string ConnectionString = "Data Source=workflows.db";

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

            // Migration: Add createdAt and updatedAt columns if they don't exist
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

        public static SqliteConnection GetConnection()
        {
            return new SqliteConnection(ConnectionString);
        }
    }
}

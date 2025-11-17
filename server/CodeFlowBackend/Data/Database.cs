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
                diagram TEXT
            );";
            command.ExecuteNonQuery();
        }

        public static SqliteConnection GetConnection()
        {
            return new SqliteConnection(ConnectionString);
        }
    }
}

/**
 * File: RouteRequestHelpers.cs
 *
 * Purpose:
 * - Provide shared request parsing and DB connection helpers for endpoint handlers.
 *
 * Controls:
 * - Raw body reads, JSON body deserialization, and opened SQLite connection creation.
 *
 * Directly related files:
 * - backend/Routes/WorkflowEndpoints.cs
 * - backend/Routes/VisualBuilderEndpoints.cs
 */

using System.Text.Json;
using Microsoft.Data.Sqlite;
using CodeFlowBackend.Data;

namespace CodeFlowBackend.Routes
{
    /// <summary>
    /// Shared helpers for minimal API route handlers.
    /// Keeps request/body parsing and DB connection setup in one place.
    /// </summary>
    public static class RouteRequestHelpers
    {
        /// <summary>
        /// Function Name: ReadBodyAsStringAsync
        ///
        /// Purpose:
        /// Read the full HTTP request body as a raw string.
        ///
        /// How It Works:
        /// Creates a StreamReader over request.Body and reads it to completion.
        ///
        /// Parameters:
        /// - request (HttpRequest): Incoming HTTP request from the endpoint delegate.
        ///
        /// Returns:
        /// - Task&lt;string&gt;: The full request body text.
        ///
        /// If You Want to Modify This Behavior:
        /// - Go to: backend/Routes/WorkflowEndpoints.cs
        /// - Change: Endpoint-specific request parsing logic.
        /// </summary>
        public static async Task<string> ReadBodyAsStringAsync(HttpRequest request)
        {
            using var reader = new StreamReader(request.Body);
            return await reader.ReadToEndAsync();
        }

        /// <summary>
        /// Function Name: ReadJsonBodyAsync
        ///
        /// Purpose:
        /// Deserialize request body JSON into a typed model.
        ///
        /// How It Works:
        /// Reads the full body text and runs System.Text.Json deserialization.
        ///
        /// Parameters:
        /// - request (HttpRequest): Incoming HTTP request.
        ///
        /// Returns:
        /// - Task&lt;T?&gt;: Parsed model or null when JSON payload is empty/invalid.
        ///
        /// If You Want to Modify This Behavior:
        /// - Go to: backend/Program.cs
        /// - Change: Global JSON options and serializer defaults.
        /// </summary>
        public static async Task<T?> ReadJsonBodyAsync<T>(HttpRequest request)
        {
            var body = await ReadBodyAsStringAsync(request);
            return JsonSerializer.Deserialize<T>(body);
        }

        /// <summary>
        /// Function Name: CreateOpenConnection
        ///
        /// Purpose:
        /// Open a SQLite connection using the shared database configuration.
        ///
        /// How It Works:
        /// Delegates connection creation to Database.GetConnection() then calls Open().
        ///
        /// Parameters:
        /// - None.
        ///
        /// Returns:
        /// - SqliteConnection: An open database connection ready for commands.
        ///
        /// If You Want to Modify This Behavior:
        /// - Go to: backend/Data/Database.cs
        /// - Change: Connection string or DB provider configuration.
        /// </summary>
        public static SqliteConnection CreateOpenConnection()
        {
            var connection = Database.GetConnection();
            connection.Open();
            return connection;
        }
    }
}

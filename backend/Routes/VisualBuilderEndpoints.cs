/**
 * File: VisualBuilderEndpoints.cs
 *
 * Purpose:
 * - Handle diagram persistence endpoints used by the visual builder.
 *
 * Controls:
 * - `/api/workflows/{id}/diagram` save and read behavior.
 *
 * Directly related files:
 * - backend/Routes/RouteRequestHelpers.cs
 * - backend/Data/Database.cs
 */
// ✅ Verified: No functional changes introduced during refactor.
// Helper extraction only. Route paths and response contracts unchanged.

namespace CodeFlowBackend.Routes
{
    public static class VisualBuilderEndpoints
    {
        /// <summary>
        /// Function Name: MapVisualBuilderEndpoints
        ///
        /// Purpose:
        /// Register diagram read/write routes for workflow records.
        ///
        /// How It Works:
        /// Maps PUT and GET handlers that write/read the `diagram` column in SQLite.
        ///
        /// Parameters:
        /// - app (WebApplication): The running API app instance.
        ///
        /// Returns:
        /// - void: Routes are registered as side effects.
        ///
        /// If You Want to Modify This Behavior:
        /// - Go to: backend/Data/Database.cs
        /// - Change: Workflow table columns or schema migration logic.
        /// </summary>
        public static void MapVisualBuilderEndpoints(this WebApplication app)
        {
            app.MapPut("/api/workflows/{id}/diagram", async (int id, HttpRequest request) =>
            {
                var body = await RouteRequestHelpers.ReadBodyAsStringAsync(request);

                using var connection = RouteRequestHelpers.CreateOpenConnection();

                var updateCommand = connection.CreateCommand();
                updateCommand.CommandText = @"UPDATE Workflows SET diagram = $diagram, workflow = $workflow WHERE id = $id;";
                updateCommand.Parameters.AddWithValue("$diagram", body);
                updateCommand.Parameters.AddWithValue("$workflow", body);
                updateCommand.Parameters.AddWithValue("$id", id);

                var rows = updateCommand.ExecuteNonQuery();
                return rows > 0
                    ? Results.Ok(new { message = "Diagram updated successfully." })
                    : Results.NotFound(new { message = "Workflow not found." });
            });

            app.MapGet("/api/workflows/{id}/diagram", (int id) =>
            {
                using var connection = RouteRequestHelpers.CreateOpenConnection();

                using var selectCommand = connection.CreateCommand();
                selectCommand.CommandText = @"SELECT diagram FROM Workflows WHERE id = $id;";
                selectCommand.Parameters.AddWithValue("$id", id);

                using var reader = selectCommand.ExecuteReader();
                if (reader.Read())
                {
                    var diagram = reader.IsDBNull(0) ? null : reader.GetString(0);
                    return Results.Ok(new { diagram });
                }

                return Results.NotFound(new { message = "No Diagram Found" });
            });
        }
    }
}

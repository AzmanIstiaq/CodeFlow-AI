/**
 * File: WorkflowEndpoints.cs
 *
 * Purpose:
 * - Define CRUD API endpoints for workflow records.
 *
 * Controls:
 * - `/api/workflows` create/list/update/delete behavior.
 *
 * Directly related files:
 * - backend/Routes/RouteRequestHelpers.cs
 * - backend/Data/Database.cs
 * - backend/Models/WorkflowRequest.cs
 */
// ✅ Verified: No functional changes introduced during refactor.
// Helper extraction only. Route paths and response contracts unchanged.

using CodeFlowBackend.Models;

namespace CodeFlowBackend.Routes
{
    public static class WorkflowEndpoints
    {
        /// <summary>
        /// Function Name: MapWorkflowEndpoints
        ///
        /// Purpose:
        /// Register workflow CRUD endpoints on the ASP.NET minimal API app.
        ///
        /// How It Works:
        /// Adds POST, GET, DELETE, and PUT route handlers that read/write SQLite data.
        ///
        /// Parameters:
        /// - app (WebApplication): The running API app instance.
        ///
        /// Returns:
        /// - void: Routes are registered as side effects.
        ///
        /// If You Want to Modify This Behavior:
        /// - Go to: backend/Models/WorkflowRequest.cs
        /// - Change: Payload shape or field requirements.
        /// </summary>
        public static void MapWorkflowEndpoints(this WebApplication app)
        {
            // POST - create workflow
            app.MapPost("/api/workflows", async (HttpRequest request) =>
            {
                var workflowRequest = await RouteRequestHelpers.ReadJsonBodyAsync<WorkflowRequest>(request);

                using var connection = RouteRequestHelpers.CreateOpenConnection();

                var insertCommand = connection.CreateCommand();
                insertCommand.CommandText = @"INSERT INTO Workflows (name, workflow, description) VALUES ($name, $workflow, $description); SELECT last_insert_rowid();";
                insertCommand.Parameters.AddWithValue("$name", workflowRequest!.Name);
                insertCommand.Parameters.AddWithValue("$workflow", workflowRequest!.Workflow);
                insertCommand.Parameters.AddWithValue("$description", workflowRequest.Description ?? (object)DBNull.Value);

                var newId = Convert.ToInt32(insertCommand.ExecuteScalar());

                return Results.Ok(new { id = newId, message = "Success" });
            });

            // GET - all workflows
            app.MapGet("/api/workflows", () =>
            {
                using var connection = RouteRequestHelpers.CreateOpenConnection();

                var selectCommand = connection.CreateCommand();
                selectCommand.CommandText = @"SELECT id, name, workflow, description, createdAt, updatedAt FROM Workflows;";
                using var reader = selectCommand.ExecuteReader();

                var workflows = new List<WorkflowRequest>();
                while (reader.Read())
                {
                    var createdAt = reader.IsDBNull(4) ? null : reader.GetString(4);
                    var updatedAt = reader.IsDBNull(5) ? null : reader.GetString(5);

                    workflows.Add(new WorkflowRequest
                    {
                        Id = reader.GetInt32(0),
                        Name = reader.GetString(1),
                        Workflow = reader.GetString(2),
                        Description = reader.IsDBNull(3) ? null : reader.GetString(3),
                        CreatedAt = createdAt ?? DateTime.UtcNow.ToString("o"),
                        UpdatedAt = updatedAt
                    });
                }

                return Results.Ok(workflows);
            });

            // DELETE - by ID
            app.MapDelete("/api/workflows/{id}", (int id) =>
            {
                using var connection = RouteRequestHelpers.CreateOpenConnection();

                var deleteCommand = connection.CreateCommand();
                deleteCommand.CommandText = @"DELETE FROM Workflows WHERE id = $id;";
                deleteCommand.Parameters.AddWithValue("$id", id);

                var rowsAffected = deleteCommand.ExecuteNonQuery();

                if (rowsAffected == 0)
                    return Results.NotFound(new { message = "Workflow not found" });

                return Results.Ok(new { message = "Deleted successfully" });
            });

            // PUT - update by ID
            app.MapPut("/api/workflows/{id}", async (int id, HttpRequest request) =>
            {
                var workflowRequest = await RouteRequestHelpers.ReadJsonBodyAsync<WorkflowRequest>(request);

                using var connection = RouteRequestHelpers.CreateOpenConnection();

                var updateCommand = connection.CreateCommand();
                updateCommand.CommandText =
                    @"UPDATE Workflows SET name = $name, workflow = $workflow, description = $description WHERE id = $id;";
                updateCommand.Parameters.AddWithValue("$name", workflowRequest!.Name);
                updateCommand.Parameters.AddWithValue("$workflow", workflowRequest!.Workflow);
                updateCommand.Parameters.AddWithValue("$description", workflowRequest.Description ?? (object)DBNull.Value);
                updateCommand.Parameters.AddWithValue("$id", id);

                var rowsAffected = updateCommand.ExecuteNonQuery();

                if (rowsAffected == 0)
                    return Results.NotFound(new { message = "Workflow not found" });

                return Results.Ok(new { message = "Updated successfully" });
            });
        }
    }
}

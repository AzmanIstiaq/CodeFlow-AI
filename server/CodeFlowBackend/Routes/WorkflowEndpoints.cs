using Microsoft.Data.Sqlite;
using System.Text.Json;
using CodeFlowBackend.Data;
using CodeFlowBackend.Models;

namespace CodeFlowBackend.Routes
{
    public static class WorkflowEndpoints
    {
        public static void MapWorkflowEndpoints(this WebApplication app)
        {
            // POST — create workflow
            app.MapPost("/api/workflows", async (HttpRequest request) =>
            {
                using var reader = new StreamReader(request.Body);
                var body = await reader.ReadToEndAsync();
                var workflowRequest = JsonSerializer.Deserialize<WorkflowRequest>(body);

                using var connection = Database.GetConnection();
                connection.Open();

                var insertCommand = connection.CreateCommand();
                insertCommand.CommandText = @"INSERT INTO Workflows (name, workflow) VALUES ($name, $workflow);";
                insertCommand.Parameters.AddWithValue("$name", workflowRequest!.Name);
                insertCommand.Parameters.AddWithValue("$workflow", workflowRequest!.Workflow);
                insertCommand.ExecuteNonQuery();

                return Results.Ok(new { message = "Success", data = body });
            });

            // GET — all workflows
            app.MapGet("/api/workflows", () =>
            {
                using var connection = Database.GetConnection();
                connection.Open();

                var selectCommand = connection.CreateCommand();
                selectCommand.CommandText = @"SELECT id, name, workflow FROM Workflows;";
                using var reader = selectCommand.ExecuteReader();

                var workflows = new List<WorkflowRequest>();
                while (reader.Read())
                {
                    workflows.Add(new WorkflowRequest
                    {
                        Id = reader.GetInt32(0),
                        Name = reader.GetString(1),
                        Workflow = reader.GetString(2)
                    });
                }

                return Results.Ok(workflows);
            });

            // DELETE — by ID
            app.MapDelete("/api/workflows/{id}", (int id) =>
            {
                using var connection = Database.GetConnection();
                connection.Open();

                var deleteCommand = connection.CreateCommand();
                deleteCommand.CommandText = @"DELETE FROM Workflows WHERE id = $id;";
                deleteCommand.Parameters.AddWithValue("$id", id);

                var rowsAffected = deleteCommand.ExecuteNonQuery();

                if (rowsAffected == 0)
                    return Results.NotFound(new { message = "Workflow not found" });

                return Results.Ok(new { message = "Deleted successfully" });
            });

            // PUT — update by ID
            app.MapPut("/api/workflows/{id}", async (int id, HttpRequest request) =>
            {
                using var reader = new StreamReader(request.Body);
                var body = await reader.ReadToEndAsync();
                var workflowRequest = JsonSerializer.Deserialize<WorkflowRequest>(body);

                using var connection = Database.GetConnection();
                connection.Open();

                var updateCommand = connection.CreateCommand();
                updateCommand.CommandText =
                    @"UPDATE Workflows SET name = $name, workflow = $workflow WHERE id = $id;";
                updateCommand.Parameters.AddWithValue("$name", workflowRequest!.Name);
                updateCommand.Parameters.AddWithValue("$workflow", workflowRequest!.Workflow);
                updateCommand.Parameters.AddWithValue("$id", id);

                var rowsAffected = updateCommand.ExecuteNonQuery();

                if (rowsAffected == 0)
                    return Results.NotFound(new { message = "Workflow not found" });

                return Results.Ok(new { message = "Updated successfully" });
            });
        }
    }
}

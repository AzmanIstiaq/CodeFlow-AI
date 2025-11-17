using CodeFlowBackend.Data;

namespace CodeFlowBackend.Routes
{
    public static class VisualBuilderEndpoints
    {
        public static void MapVisualBuilderEndpoints(this WebApplication app)
        {
            app.MapPut("/api/workflows/{id}/diagram", async (int id, HttpRequest request) =>
            {
                using var reader = new StreamReader(request.Body);
                var body = await reader.ReadToEndAsync();

                using var connection = Database.GetConnection();
                connection.Open();

                var updateCommand = connection.CreateCommand();
                updateCommand.CommandText = @"UPDATE Workflows SET diagram = $diagram WHERE id = $id;";
                updateCommand.Parameters.AddWithValue("$diagram", body);
                updateCommand.Parameters.AddWithValue("$id", id);

                var rows = updateCommand.ExecuteNonQuery();
                return rows > 0 ? Results.Ok(new { message = "Diagram updated successfully." }) : Results.NotFound(new { message = "Workflow not found." });
            });

            app.MapGet("/api/workflows/{id}/diagram", (int id) =>
            {
                using var connection = Database.GetConnection();
                connection.Open();

                using var selectCommand = connection.CreateCommand();
                selectCommand.CommandText = @"SELECT diagram FROM Workflows WHERE id = $id;";
                selectCommand.Parameters.AddWithValue("$id", id);

                using var reader = selectCommand.ExecuteReader();
                if (reader.Read())
                {
                    var diagram = reader.IsDBNull(0) ? null : reader.GetString(0);
                    return Results.Ok(new { diagram });
                }
                else
                {
                    return Results.NotFound(new { message = "No Diagram Found" });
                }
            });
        }
    }
}
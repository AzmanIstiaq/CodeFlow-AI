using Microsoft.Data.Sqlite;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();
app.UseCors("AllowAll");

// Initialize the SQLite database and create the Workflows table if it doesn't exist
using var connection = new SqliteConnection("Data Source=workflows.db");

connection.Open();

var command = connection.CreateCommand();

command.CommandText =
@"CREATE TABLE IF NOT EXISTS Workflows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        workflow TEXT NOT NULL
    );
    ";

command.ExecuteNonQuery();

// API Endpoints
// Endpoint to create a new workflow
app.MapPost("/api/workflows", async (HttpRequest request) =>
{
    using var reader = new StreamReader(request.Body);
    var body = await reader.ReadToEndAsync();
    var workflowRequest = JsonSerializer.Deserialize<WorkflowRequest>(body);

    using var connection = new SqliteConnection("Data Source=workflows.db");
    connection.Open();
    var insertCommand = connection.CreateCommand();
    insertCommand.CommandText = @"INSERT INTO Workflows (name, workflow) VALUES ($name, $workflow);";
    insertCommand.Parameters.AddWithValue("$name", workflowRequest!.Name);
    insertCommand.Parameters.AddWithValue("$workflow", workflowRequest!.Workflow);

    insertCommand.ExecuteNonQuery();

    return Results.Ok(new { message = "Success", data = body });
});

// Endpoint to get all workflows
app.MapGet("/api/workflows", () =>
{
    using var connection = new SqliteConnection("Data Source=workflows.db");
    connection.Open();
    var selectCommand = connection.CreateCommand();
    selectCommand.CommandText = @"SELECT id, name, workflow FROM Workflows;";

    using var reader = selectCommand.ExecuteReader();
    var workflows = new List<Dictionary<string, object>>();

    while (reader.Read())
    {
        var workflow = new Dictionary<string, object>
        {
            { "id", reader.GetInt32(0) },
            { "name", reader.GetString(1) },
            { "workflow", reader.GetString(2) }
        };
        workflows.Add(workflow);
    }

    return Results.Ok(workflows);
});

// Endpoint to delete a workflow by id
app.MapDelete("/api/workflows/{id}", (int id) =>
{
    using var connection = new SqliteConnection("Data Source=workflows.db");
    connection.Open();
    var deleteCommand = connection.CreateCommand();
    deleteCommand.CommandText = @"DELETE FROM Workflows WHERE id = $id;";
    deleteCommand.Parameters.AddWithValue("$id", id);

    var rowsAffected = deleteCommand.ExecuteNonQuery();

    if (rowsAffected == 0)
    {
        return Results.NotFound(new { message = "Workflow not found" });
    }

    return Results.Ok(new { message = "Deleted successfully" });
});

app.MapPut("/api/workflows/{id}", async (int id, HttpRequest request) =>
{
    using var reader = new StreamReader(request.Body);
    var body = await reader.ReadToEndAsync();
    var workflowRequest = JsonSerializer.Deserialize<WorkflowRequest>(body);

    using var connection = new SqliteConnection("Data Source=workflows.db");
    connection.Open();
    var updateCommand = connection.CreateCommand();
    updateCommand.CommandText = @"UPDATE Workflows SET name = $name, workflow = $workflow WHERE id = $id;";
    updateCommand.Parameters.AddWithValue("$name", workflowRequest!.Name);
    updateCommand.Parameters.AddWithValue("$workflow", workflowRequest!.Workflow);
    updateCommand.Parameters.AddWithValue("$id", id);

    var rowsAffected = updateCommand.ExecuteNonQuery();

    if (rowsAffected == 0)
    {
        return Results.NotFound(new { message = "Workflow not found" });
    }

    return Results.Ok(new { message = "Updated successfully" });
});

app.Run();

public class WorkflowRequest
{
    public required string Name { get; set; }
    public required string Workflow{ get; set; }
};
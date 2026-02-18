/**
 * File: Program.cs
 *
 * Purpose:
 * - Configure and start the backend web API.
 *
 * Controls:
 * - CORS policy, database initialization, and endpoint registration.
 *
 * Directly related files:
 * - backend/Data/Database.cs
 * - backend/Routes/WorkflowEndpoints.cs
 * - backend/Routes/VisualBuilderEndpoints.cs
 * - backend/Routes/ExecutionEndpoints.cs
 */

using CodeFlowBackend.Data;
using CodeFlowBackend.Routes;

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

Database.Initialize();

app.MapWorkflowEndpoints();
app.MapVisualBuilderEndpoints();
app.MapExecutionEndpoints();

app.Run();

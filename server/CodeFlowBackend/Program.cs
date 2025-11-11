using Microsoft.Data.Sqlite;
using System.Text.Json;
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

app.Run();

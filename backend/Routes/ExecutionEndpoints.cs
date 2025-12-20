using System.Text.Json;
using CodeFlowBackend.Models;

namespace CodeFlowBackend.Routes
{
    public static class ExecutionEndpoints
    {
        public static void MapExecutionEndpoints(this WebApplication app)
        {
            app.MapPost("/api/executeWorkflow", async (ExecuteWorkflowRequest request, IConfiguration configuration) =>
            {
                try
                {
                    // Validate request
                    if (string.IsNullOrWhiteSpace(request.Prompt))
                    {
                        return Results.BadRequest(new ExecuteWorkflowResponse 
                        { 
                            Error = "Prompt is required" 
                        });
                    }

                    if (string.IsNullOrWhiteSpace(request.Model))
                    {
                        return Results.BadRequest(new ExecuteWorkflowResponse 
                        { 
                            Error = "Model is required" 
                        });
                    }

                    // Get Ollama configuration
                    var ollamaBaseUrl = configuration["Ollama:BaseUrl"];

                    if (string.IsNullOrWhiteSpace(ollamaBaseUrl))
                    {
                        return Results.Json(new ExecuteWorkflowResponse
                        {
                            Error = "Ollama base URL is not configured"
                        }, statusCode: 500);
                    }

                    // Call Ollama API
                    using var httpClient = new HttpClient();
                    httpClient.Timeout = TimeSpan.FromMinutes(2);

                    var ollamaRequest = new
                    {
                        model = request.Model,
                        prompt = request.Prompt,
                        stream = false,
                        options = new
                        {
                            temperature = request.Temperature ?? 0.7
                        }
                    };

                    var jsonContent = JsonSerializer.Serialize(ollamaRequest);
                    var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

                    var response = await httpClient.PostAsync($"{ollamaBaseUrl}/api/generate", content);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        return Results.Json(new ExecuteWorkflowResponse 
                        { 
                            Error = $"Ollama API error: {errorContent}" 
                        }, statusCode: 500);
                    }

                    var responseContent = await response.Content.ReadAsStringAsync();
                    var ollamaResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

                    var output = ollamaResponse.GetProperty("response").GetString();

                    return Results.Ok(new ExecuteWorkflowResponse 
                    { 
                        Output = output 
                    });
                }
                catch (HttpRequestException ex)
                {
                    return Results.Json(new ExecuteWorkflowResponse 
                    { 
                        Error = $"Failed to connect to Ollama. Make sure Ollama is running (ollama serve). Details: {ex.Message}" 
                    }, statusCode: 500);
                }
                catch (TaskCanceledException)
                {
                    return Results.Json(new ExecuteWorkflowResponse 
                    { 
                        Error = "Request timeout. The model may be too large or slow." 
                    }, statusCode: 500);
                }
                catch (Exception ex)
                {
                    return Results.Json(new ExecuteWorkflowResponse 
                    { 
                        Error = $"Execution error: {ex.Message}" 
                    }, statusCode: 500);
                }
            });
        }
    }
}

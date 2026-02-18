/**
 * File: WorkflowRequest.cs
 *
 * Purpose:
 * - Define serialized workflow payload shape used by API endpoints.
 *
 * Controls:
 * - Workflow create/update/list fields exchanged between frontend and backend.
 *
 * Directly related files:
 * - backend/Routes/WorkflowEndpoints.cs
 * - frontend/src/api/api.ts
 */

using System.Text.Json.Serialization;

namespace CodeFlowBackend.Models
{
    public class WorkflowRequest
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public required string Name { get; set; }

        [JsonPropertyName("workflow")]
        public required string Workflow { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("createdAt")]
        public string? CreatedAt { get; set; }

        [JsonPropertyName("updatedAt")]
        public string? UpdatedAt { get; set; }
    }
}

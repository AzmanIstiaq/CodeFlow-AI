/**
 * File: ExecuteWorkflowRequest.cs
 *
 * Purpose:
 * - Define request/response payload contracts for workflow execution.
 *
 * Controls:
 * - Prompt/model/temperature input and output/error response fields.
 *
 * Directly related files:
 * - backend/Routes/ExecutionEndpoints.cs
 * - frontend/src/api/api.ts
 */

namespace CodeFlowBackend.Models
{
    public class ExecuteWorkflowRequest
    {
        public required string Prompt { get; set; }
        public required string Model { get; set; }
        public double? Temperature { get; set; }
    }

    public class ExecuteWorkflowResponse
    {
        public string? Output { get; set; }
        public string? Error { get; set; }
    }
}

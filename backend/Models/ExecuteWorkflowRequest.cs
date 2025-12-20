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

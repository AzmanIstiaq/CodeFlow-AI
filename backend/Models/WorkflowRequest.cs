namespace CodeFlowBackend.Models
{
    public class WorkflowRequest
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string Workflow { get; set; }
        public string? Description { get; set; }
        public string? CreatedAt { get; set; }
        public string? UpdatedAt { get; set; }
    }
}

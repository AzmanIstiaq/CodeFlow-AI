namespace CodeFlowBackend.Models
{
    public class WorkflowRequest
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string Workflow { get; set; }
    }
}

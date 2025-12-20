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

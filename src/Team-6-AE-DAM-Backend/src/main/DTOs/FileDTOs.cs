
using System.Text.Json.Serialization;

namespace DAMBackend.Models
{

    public class FileDTO
    {
        public FileDTO() { }
        public DateTime? date { get; set; }
        public List<string> metadata { get; set; } = new List<string> { };
        public int projectId { get; set; }
        public string location { get; set; }
        public string filePath { get; set; }
        public int userId { get; set; }
        public bool palette { get; set; }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public ImageResolution resolution { get; set; }
    }
    public class MetadataTagDTO
    {
        public string Key { get; set; }
        public string Value { get; set; }
        public value_type Type { get; set; }
    }
    public enum ImageResolution
    {
        Low,
        Medium,
        High
    }
}
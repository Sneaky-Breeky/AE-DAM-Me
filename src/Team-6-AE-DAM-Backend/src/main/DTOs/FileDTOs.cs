
using System.Text.Json.Serialization;

namespace DAMBackend.Models
{

public class FileDTO
    {
        public FileDTO() { }
        public DateTime? date { get; set; }
        public List<string> metadata { get; set; } = new List<string> { };
        public int? projectId { get; set; }
        public string location { get; set; }
        public string filePath { get; set; }
        public int userId { get; set; }
        public bool palette { get; set; }

        public decimal? gpsLat { get; set; }
        public decimal? gpsLon { get; set; }
        public decimal? gpsAlt { get; set; }

        public  int pixelWidth { get; set; }
        public  int pixelHeight { get; set; }
        public string? make { get; set; }
        public string? model { get; set; }
        public int? focalLength { get; set; }
        public float? aperture { get; set; }
        public string? copyright { get; set; }

        public string? thumbnailPath { get; set; }
        public string? viewPath { get; set; }

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

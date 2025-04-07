using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using System.Text.Json.Serialization;


namespace DAMBackend.Models
{
    public class LogImage
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int LogId { get; set; }
        
        public int? FileId { get; set; }
        public int? ProjectId { get; set; }
        [Required] public int UserId { get; set; }
        [Required] public string TypeOfLog { get; set; }
        public DateTime? LogDate { get; set; }

        [JsonIgnore] public UserModel? User { get; set; }
        [JsonIgnore] public FileModel? File { get; set; }
        [JsonIgnore] public ProjectModel? Project { get; set; }
        
        public LogImage() { }

        public LogImage(int? fileId, int? projectId, int userId, string typeOfLog, DateTime date)
        {
            FileId = fileId;
            ProjectId = projectId;
            UserId = userId;
            TypeOfLog = typeOfLog;
            LogDate = date;
        }
    }
}
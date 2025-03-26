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

        [Required] public int FileId { get; set; }

        [JsonIgnore] public FileModel File { get; set; }
        [Required] public int UserId { get; set; }

        [JsonIgnore] public UserModel User { get; set; }
        [Required] public string TypeOfLog { get; set; }
        [Required] public DateTime Date { get; set; }



        public LogImage(int fileId, int userId, string typeOfLog, DateTime date)
        {
            FileId = fileId;
            UserId = userId;
            TypeOfLog = typeOfLog;
            Date = date;
        }
    }
}
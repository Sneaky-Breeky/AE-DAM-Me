using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
public class LogImage
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int LogId { get; set; }
    [Required]
    public Guid FileId { get; set; }
    [Required]
    public int UserId { get; set; }
    [Required]
    public string TypeOfLog { get; set; }
    [Required]
    public DateTime Date { get; set; }

    public LogImage(Guid fileId, int userId, string typeOfLog, DateTime date)
    {
        FileId = fileId;
        UserId = userId;
        TypeOfLog = typeOfLog;
        Date = date;
    }
}
namespace DefaultNamespace;

public class ImageLog
{
    public int ImageId { get; set; }
    
    public int LogId { get; set; }
    
    public DateTime DateTimeOfLog { get; set; }
    
    public ImageLog(int imageId, int logId, DateTime dateTimeOfLog)
    {
        ImageId = imageId;
        LogId = logId;
        DateTimeOfLog = dateTimeOfLog;
    }
}
public class LogImage
{
    public int LogId { get; set; }
    public int ImageId { get; set; }
    public int UserId { get; set; }
    public string UserType { get; set; }
    public string TypeOfLog { get; set; }

    public Log(int logId, int imageId, int userId, string userType, string typeOfLog)
    {
        LogId = logId;
        ImageId = imageId;
        UserId = userId;
        UserType = userType;
        TypeOfLog = typeOfLog;
    }
    public List<Log> GetLogsByImageId(int userId)
    {
        var logsForImage = logs.Where(log => log.userId == userId).ToList();
        return logsForImage;
    }
    public List<Log> GetLogsByImageIdForUser(int userId, string userType)
        {
            var logsForImage = logs.Where(log => log.userId == userId && log.UserType == userType).ToList();
            return logsForImage;
        }
}
public class LogImage
{
    public int LogId { get; set; }
    public int ImageId { get; set; }
    public int UserId { get; set; }
    public string UserType { get; set; }
    public string TypeOfLog { get; set; }

    public LogImage(int logId, int imageId, int userId, string userType, string typeOfLog)
    {
        LogId = logId;
        ImageId = imageId;
        UserId = userId;
        UserType = userType;
        TypeOfLog = typeOfLog;
        Date = date;
    }
    public List<Log> GetLogsByImageId(int imageId)
    {
        var logsForImage = logs.Where(log => log.imageId == imageId).ToList();
        return logsForImage;
    }
    public List<Log> GetLogsByImageIdForUser(int imageId, string userType)
        {
            var logsForImage = logs.Where(log => log.imageId == imageId && log.UserType == userType).ToList();
            return logsForImage;
        }
    public List<Log> GetLogsByForUser(int userId)
            {
                var logsForUser = logs.Where(log => log.userId == userId).ToList();
                return logsForUser;
            }
}
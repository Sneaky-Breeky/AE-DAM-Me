namespace DefaultNamespace;

// is it possible to make changes to same image at same time
// do we need to log which user made a change or just about the type of change

public class Log
{
    public int LogId { get; set; }
    public string TypeOfLog { get; set; }
    public Log(string typeOfLog, int logId)
    {
        TypeOfLog = typeOfLog;
        LogId = logId;
    }
    
}
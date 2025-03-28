namespace DAMBackend.Models;

public class ProjectTagDTO
{
    public int ProjectId { get; set; }
    public string Key { get; set; }
    public string Value { get; set; }
    public int Type { get; set; }
}
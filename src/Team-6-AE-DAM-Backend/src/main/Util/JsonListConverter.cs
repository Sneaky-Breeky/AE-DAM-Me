using System.Text.Json;
using CsvHelper;
using CsvHelper.Configuration;
using CsvHelper.TypeConversion;

public class JsonListConverter : ITypeConverter
{
    public object ConvertFromString(string text, IReaderRow row, MemberMapData memberMapData)
    {
        return string.IsNullOrWhiteSpace(text) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(text);
    }

    public string ConvertToString(object value, IWriterRow row, MemberMapData memberMapData)
    {
        return value is List<string> list ? JsonSerializer.Serialize(list) : "[]";
    }
}
using CsvHelper;
using CsvHelper.Configuration;
using CsvHelper.TypeConversion;
using System.Collections.Generic;
using System.Text.Json;

public class ListToJsonConverter<T> : DefaultTypeConverter
{
    public override string ConvertToString(object value, IWriterRow row, MemberMapData memberMapData)
    {
        if (value is IEnumerable<T> list)
        {
            return JsonSerializer.Serialize(list); // Convert list to JSON string
        }
        return "[]"; // Return empty JSON array if null
    }
}
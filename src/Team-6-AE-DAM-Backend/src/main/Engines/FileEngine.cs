using System;
using System.Linq;
using MetadataExtractor;
using MetadataExtractor.Formats.Exif;
using MetadataExtractor.Formats.QuickTime;

public class FileEngine
{
    public static (int Width, int Height)? GetDimensions(string filePath)
    {
        try
        {
            var directories = ImageMetadataReader.ReadMetadata(filePath);

            // Check for Image dimensions (JPEG, PNG, RAW, etc.)
            var exifDir = directories.OfType<ExifSubIfdDirectory>().FirstOrDefault();
            if (exifDir != null)
            {
                int width = exifDir.GetInt32(ExifDirectoryBase.TagImageWidth);
                int height = exifDir.GetInt32(ExifDirectoryBase.TagImageHeight);
                return (width, height);
            }

            // Check for Video dimensions (MP4, MOV, AVI, etc.)
            var quickTimeDir = directories.OfType<QuickTimeTrackHeaderDirectory>().FirstOrDefault();
            if (quickTimeDir != null)
            {
                int width = quickTimeDir.GetInt32(QuickTimeTrackHeaderDirectory.TagWidth);
                int height = quickTimeDir.GetInt32(QuickTimeTrackHeaderDirectory.TagHeight);
                return (width, height);
            }

            return null; // No dimensions found
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error extracting metadata: {ex.Message}");
            return null;
        }
    }
}

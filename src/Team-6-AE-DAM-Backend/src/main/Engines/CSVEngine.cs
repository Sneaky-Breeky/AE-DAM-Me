using System.Globalization;
using System.IO.Compression;
using System.Text;
using CsvHelper;
using DAMBackend.blob;
using DAMBackend.Models;
using NuGet.Protocol;

public class CsvEngine
{
    private readonly AzureBlobService _blobStorageService;
    
    public CsvEngine(AzureBlobService blobStorageService)
    {
        _blobStorageService = blobStorageService;
    }

    public async Task<string> GenerateCsvAndUploadAsync(ProjectModel project, List<FileModel> files)
    {
        // Console.WriteLine(project.ToJson());
        if (project == null)
        {
            throw new Exception("No project found to export.");
        }

        using var csvMemoryStream = new MemoryStream();
        using (var streamWriter = new StreamWriter(csvMemoryStream, Encoding.UTF8, leaveOpen: true))
        using (var csvWriter = new CsvWriter(streamWriter, CultureInfo.InvariantCulture))
        {
            csvWriter.WriteRecords(new List<ProjectModel> { });
            streamWriter.Flush();
        }
        csvMemoryStream.Position = 0;

        // Step 2: Generate CSV for files
        using var filesCsvMemoryStream = new MemoryStream();
        using (var filesStreamWriter = new StreamWriter(filesCsvMemoryStream, Encoding.UTF8, leaveOpen: true))
        using (var filesCsvWriter = new CsvWriter(filesStreamWriter, CultureInfo.InvariantCulture))
        {
            filesCsvWriter.WriteRecords(files);
            filesStreamWriter.Flush();
        }
        filesCsvMemoryStream.Position = 0;

        // Step 3: Create ZIP in Memory
        using var zipMemoryStream = new MemoryStream();
        using (var zipArchive = new ZipArchive(zipMemoryStream, ZipArchiveMode.Create, true))
        {

            var csvEntry = zipArchive.CreateEntry($"projects_{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
            using (var entryStream = csvEntry.Open())
            {
                await csvMemoryStream.CopyToAsync(entryStream);
            }


            var filesCsvEntry = zipArchive.CreateEntry($"files_{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
            using (var entryStream = filesCsvEntry.Open())
            {
                await filesCsvMemoryStream.CopyToAsync(entryStream);
            }


            foreach (var fileUrl in files.Select(f => f.OriginalPath))
            {
                try
                {
                    Uri uri = new Uri(fileUrl);
                    string fileName = Path.GetFileName(uri.LocalPath); // Extracts filename

                    using var fileStream = await _blobStorageService.DownloadFileFromUrlAsync(fileUrl);
                    if (fileStream != null)
                    {
                        var fileEntry = zipArchive.CreateEntry(fileName);
                        using (var entryStream = fileEntry.Open())
                        {
                            await fileStream.CopyToAsync(entryStream);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to add file {fileUrl} to ZIP: {ex.Message}");
                }
            }
        }

        zipMemoryStream.Position = 0;


        string zipFileName = $"export_{DateTime.UtcNow:yyyyMMddHHmmss}.zip";
        string zipFileUrl = await _blobStorageService.UploadAsync(zipMemoryStream, zipFileName);

        return zipFileUrl;
    }
}
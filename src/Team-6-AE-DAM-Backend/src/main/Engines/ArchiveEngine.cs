using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using DAMBackend.Models;
using Google.Protobuf.Reflection;

namespace DAMBackend.blob
{
    public class AzureBlobArchiveService
    {
        private readonly BlobContainerClient _archiveContainer;

        public AzureBlobArchiveService(BlobServiceClient blobServiceClient)
        {
            try
            {
                var archiveContainerName = "archive"; // adjust if needed

                _archiveContainer = blobServiceClient.GetBlobContainerClient(archiveContainerName);
                _archiveContainer.CreateIfNotExists();
                Console.WriteLine($"Azure Blob container '{archiveContainerName}' is ready.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to connect to Azure Archive Blob: {ex.Message}");
                throw;
            }
        }

        public async Task<string> UploadToArchiveAsync(IFormFile file, string blobName)
        {
            var blobClient = _archiveContainer.GetBlobClient(blobName);
            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, overwrite: true);
            return blobClient.Uri.ToString();
        }

        public BlobContainerClient ArchiveContainer => _archiveContainer;
    }
}
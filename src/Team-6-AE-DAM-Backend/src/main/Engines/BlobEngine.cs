using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using DAMBackend.Models;
using Google.Protobuf.Reflection;

namespace DAMBackend.blob
{
    public class AzureBlobService
    {
        private readonly BlobContainerClient _projectsContainer;
        private readonly BlobContainerClient _palettesContainer;
        private readonly BlobContainerClient _assetsContainer;

        private readonly BlobContainerClient _projectExportContainer;

        public AzureBlobService(BlobServiceClient blobServiceClient)
        {
            try
            {
                var projectsContainerName = "projects";
                var palettesContainerName = "palettes";
                var assetsContainerName = "assets";
                var projectExportContainerName = "export";


                _projectsContainer = blobServiceClient.GetBlobContainerClient(projectsContainerName);
                _projectsContainer.CreateIfNotExists();
                Console.WriteLine($"Azure Blob container '{projectsContainerName}' is ready.");

                _palettesContainer = blobServiceClient.GetBlobContainerClient(palettesContainerName);
                _palettesContainer.CreateIfNotExists();
                Console.WriteLine($"Azure Blob container '{palettesContainerName}' is ready.");

                _projectExportContainer = blobServiceClient.GetBlobContainerClient(projectExportContainerName);
                _projectExportContainer.CreateIfNotExists();
                Console.WriteLine($"Azure Blob container '{projectExportContainerName}' is ready.");

                _assetsContainer = blobServiceClient.GetBlobContainerClient(assetsContainerName);
                _assetsContainer.CreateIfNotExists();
                Console.WriteLine($"Azure Blob container '{assetsContainerName}' is ready.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to connect to Azure Blob containers: {ex.Message}");
                throw;
            }
        }

        public async Task<string> UploadAsync(IFormFile file, string blobName, ContainerType containerType)
        {
            BlobContainerClient container = containerType switch
            {
                ContainerType.Project => _projectsContainer,
                ContainerType.Palette => _palettesContainer
            };

            var blobClient = container.GetBlobClient(blobName);
            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, overwrite: true);
            return blobClient.Uri.ToString();
        }
        
        public async Task<string> UploadAsync(MemoryStream stream, string blobName)
        {
            BlobContainerClient container = _projectExportContainer;

            var blobClient = container.GetBlobClient(blobName);
            await blobClient.UploadAsync(stream, overwrite: true);
            return blobClient.Uri.ToString();
        }


        public BlobContainerClient ProjectsContainer => _projectsContainer;
        public BlobContainerClient PalettesContainer => _palettesContainer;

        public async Task<string?> MoveBlobWithinContainerAsync(string sourceFolder, string fileName, string targetFolder)
        {
            string sourceBlobPath = string.Concat(fileName);
            string targetBlobPath = string.Concat(fileName);
            
            BlobClient sourceBlob = _palettesContainer.GetBlobClient(sourceBlobPath);
            BlobClient targetBlob = _projectsContainer.GetBlobClient(targetBlobPath);

            if (!await sourceBlob.ExistsAsync())
            {
                Console.WriteLine("Source file not found!");
                return null;
            }

            // Start Copy
            await targetBlob.StartCopyFromUriAsync(sourceBlob.Uri);

            // Wait for copy to complete
            BlobProperties targetBlobProperties = await targetBlob.GetPropertiesAsync();
            while (targetBlobProperties.CopyStatus == CopyStatus.Pending)
            {
                await Task.Delay(500);
                targetBlobProperties = await targetBlob.GetPropertiesAsync();
            }

            // Delete source file after successful copy
            if (targetBlobProperties.CopyStatus == CopyStatus.Success)
            {
                await sourceBlob.DeleteAsync();
                Console.WriteLine($"File moved successfully from '{sourceBlobPath}' to '{targetBlobPath}'.");
                return targetBlob.Uri.ToString();  //Return new file URL
            }

            return null;
        }

        public async Task<Stream> DownloadFileFromUrlAsync(string fileUrl)
        {
            try
            {
                BlobClient blobClient = new BlobClient(new Uri(fileUrl)); // Initialize BlobClient from URL
                MemoryStream memoryStream = new MemoryStream();
                await blobClient.DownloadToAsync(memoryStream);
                memoryStream.Position = 0; // Reset stream position for reading
                return memoryStream;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error downloading file {fileUrl}: {ex.Message}");
                return null;
            }
        }
    }
    public enum ContainerType
    {
        Palette,
        Project
    }
}

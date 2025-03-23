using Azure.Storage.Blobs;

namespace DAMBackend.blob
{
    public class AzureBlobService
    {
        private readonly BlobContainerClient _projectsContainer;
        private readonly BlobContainerClient _palettesContainer;

        public AzureBlobService(BlobServiceClient blobServiceClient)
        {
            try
            {
                var projectsContainerName = "projects";
                var palettesContainerName = "palettes";

                _projectsContainer = blobServiceClient.GetBlobContainerClient(projectsContainerName);
                _projectsContainer.CreateIfNotExists();
                Console.WriteLine($"Azure Blob container '{projectsContainerName}' is ready.");

                _palettesContainer = blobServiceClient.GetBlobContainerClient(palettesContainerName);
                _palettesContainer.CreateIfNotExists();
                Console.WriteLine($"Azure Blob container '{palettesContainerName}' is ready.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to connect to Azure Blob containers: {ex.Message}");
                throw;
            }
        }

        public async Task<string> UploadAsync(IFormFile file, string blobName, string containerType)
        {
            BlobContainerClient container = containerType switch
            {
                "projects" => _projectsContainer,
                "palettes" => _palettesContainer,
                _ => throw new ArgumentException("Invalid container type")
            };

            var blobClient = container.GetBlobClient(blobName);
            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, overwrite: true);
            return blobClient.Uri.ToString();
        }


        public BlobContainerClient ProjectsContainer => _projectsContainer;
        public BlobContainerClient PalettesContainer => _palettesContainer;

    }
}

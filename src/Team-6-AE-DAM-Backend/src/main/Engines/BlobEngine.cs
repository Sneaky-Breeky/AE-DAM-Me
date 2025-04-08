using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using DAMBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace DAMBackend.blob
{
    public class AzureBlobService
    {
        private readonly BlobContainerClient _projectsContainer;
        private readonly BlobContainerClient _palettesContainer;
        private readonly BlobContainerClient _assetsContainer;
        private readonly BlobContainerClient _thumbnailContainer;

        private readonly BlobContainerClient _projectExportContainer;

        private readonly BlobServiceClient _blobServiceClient;

        public AzureBlobService(BlobServiceClient blobServiceClient)
        {
            try
            {
                _blobServiceClient = blobServiceClient;

                var projectsContainerName = "projects";
                var palettesContainerName = "palettes";
                var assetsContainerName = "assets";
                var projectExportContainerName = "export";
                var thumbnailContainerName = "thumbnail";

    
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

                _thumbnailContainer = blobServiceClient.GetBlobContainerClient(thumbnailContainerName);
                _thumbnailContainer.CreateIfNotExists();
                Console.WriteLine($"Azure Blob container '{thumbnailContainerName}' is ready.");
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

        public async Task<string> UploadThumbnailAsync(IFormFile file, string blobName)
        {
            BlobContainerClient container = _thumbnailContainer;

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
        
        public async Task<IFormFile> GetFormFileFromUrlAsync(string fileUrl)
        {
            var stream = await DownloadFileFromUrlAsync(fileUrl);

            if (stream == null)
                return null;

            // You can extract the file name from the URL
            string fileName = Path.GetFileName(new Uri(fileUrl).LocalPath);

            
            // Reset stream position so it's readable
            stream.Position = 0;
        
            // Create a new IFormFile from memory stream
            var compressedFile = new FormFile(stream, 0, stream.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/jpeg"
            };

            return compressedFile;
        }


        // set a project to be archived, return a boolean
        public async Task<bool> SetProjectToArchiveAsync(int projectId, SQLDbContext _context)
        {
            try
            {
                var files = await _context.Files
                    .Where(f => f.ProjectId == projectId)
                    .ToListAsync();

                if (!files.Any())
                {
                    Console.WriteLine($"No files found for project {projectId}.");
                    return true;
                }

                foreach (var file in files)
                {
                    try
                    {
                        var uris = new[] { file.OriginalPath, file.ViewPath, file.ThumbnailPath };
                        foreach (var uri in uris)
                        {
                            if (string.IsNullOrWhiteSpace(uri))
                                continue;

                            try
                            {
                                var (container, blobName) = ParseBlobInfoFromUri(uri);
                                var containerClient = _blobServiceClient.GetBlobContainerClient(container);
                                var blobClient = containerClient.GetBlobClient(blobName);
                                await blobClient.SetAccessTierAsync(AccessTier.Archive);
                                Console.WriteLine($"Archived: {uri}");
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Failed to archive blob {uri}: {ex.Message}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to archive file {file.Id}: {ex.Message}");
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to archive project {projectId}: {ex.Message}");
                return false;
            }
        }
    

        // set a project back to active, 
        public async Task<bool> UnarchiveProjectAsync(int projectId, SQLDbContext _context)
        {
            try
            {
                var files = await _context.Files
                    .Where(f => f.ProjectId == projectId)
                    .ToListAsync();

                if (!files.Any())
                {
                    Console.WriteLine($"No files found for project {projectId}.");
                    return false;
                }

                foreach (var file in files)
                {
                    try
                    {
                        var uris = new[] { file.OriginalPath, file.ViewPath, file.ThumbnailPath };
                        foreach (var uri in uris)
                        {
                            if (string.IsNullOrWhiteSpace(uri))
                                continue;

                            try
                            {
                                var (container, blobName) = ParseBlobInfoFromUri(uri);
                                var containerClient = _blobServiceClient.GetBlobContainerClient(container);
                                var blobClient = containerClient.GetBlobClient(blobName);
                                await blobClient.SetAccessTierAsync(AccessTier.Hot);
                                Console.WriteLine($"Unarchived: {uri}");
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Failed to unarchive blob {uri}: {ex.Message}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to unarchive file {file.Id}: {ex.Message}");
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to unarchive project {projectId}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> DeleteProjectFileAsync(string fileName)
        {
            var blobClient = _projectsContainer.GetBlobClient(fileName);
            return await blobClient.DeleteIfExistsAsync();
        }
        public async Task<bool> DeletePaletteFileAsync(string fileName)
        {
            var blobClient = _palettesContainer.GetBlobClient(fileName);
            return await blobClient.DeleteIfExistsAsync();
        }


        private (string containerName, string blobName) ParseBlobInfoFromUri(string uri)
        {
            var parsedUri = new Uri(uri);
            var segments = parsedUri.AbsolutePath.TrimStart('/').Split('/', 2); // [container, blobPath]
            return (segments[0], segments[1]);
        }

        public async Task<bool> DeleteAsync(string fileUrl)
        {
            try
            {
                var (container, blobName) = ParseBlobInfoFromUri(fileUrl);
                var containerClient = _blobServiceClient.GetBlobContainerClient(container);
                var blobClient = containerClient.GetBlobClient(blobName);
                return await blobClient.DeleteIfExistsAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting blob {fileUrl}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> DeleteThumbnailAsync(string fileUrl)
        {
            return await DeleteAsync(fileUrl); // It’s just another blob, same deletion logic
        }

    }

    public enum ContainerType
    {
        Palette,
        Project
    }
}

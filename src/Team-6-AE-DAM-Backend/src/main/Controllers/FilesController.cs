using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DAMBackend.Data;
using DAMBackend.Models;
using NuGet.Protocol;
using DAMBackend.blob;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;
using Xabe.FFmpeg;
using SixLabors.ImageSharp.Metadata;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;
using DAMBackend.Models;
using ImageMagick;
using System.Diagnostics;
using File = System.IO.File;
using ImageSharpExif = SixLabors.ImageSharp.Metadata.Profiles.Exif;
using ImageSharpExifTag = SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag;
using DAMBackend.SubmissionEngineEnv;
using System.IO.Compression;
using ImageSharpImage = SixLabors.ImageSharp.Image;

namespace DAMBackend.Controllers
{
    public class UpladedFile
    {
        public string ThumbnailPath { get; set; }
        public string OriginalPath { get; set; }
        public string ViewPath { get; set; }

        public decimal? GPSLat { get; set; }
        public decimal? GPSLon { get; set; }
        public decimal? GPSAlt { get; set; }

        public  int PixelWidth { get; set; }
        public  int PixelHeight { get; set; }
        public string? Make { get; set; }
        public string? Model { get; set; }
        public int? FocalLength { get; set; }
        public float? Aperture { get; set; }
        public string? Copyright { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class FilesController : ControllerBase
    {
        private readonly AzureBlobService _azureBlobService;
        private readonly SQLDbContext _context;
        
        private SubmissionEngine _submissionEngine;

        public FilesController(SQLDbContext context, AzureBlobService azureBlobService)
        {
            _context = context;
            _azureBlobService = azureBlobService;
            _submissionEngine = new SubmissionEngine();
        }

        // GET: api/Files
        [HttpGet("{userId}/palette")]
        public async Task<ActionResult<IEnumerable<FileModel>>> GetFiles(int userId)
        {
            var files = await _context.Files
                .Where(f => f.UserId == userId && f.Palette)
                .Include(f => f.bTags)
                .ToListAsync();
            return Ok(files);
        }

        // GET: api/Files
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FileModel>>> GetFilesFromPalette()
        {
            var files = await _context.Files.ToListAsync();
            return Ok(files);
        }

        // GET: api/Files/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<FileModel>> GetFile(int id)
        {
            var @file = await _context.Files.FindAsync(id);

            if (@file == null)
            {
                return NotFound();
            }

            return Ok(@file);
        }

        // PUT: api/Files/{id}
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFile(int id, FileModel @file)
        {
            if (!id.Equals(@file.Id))
            {
                return BadRequest();
            }

            _context.Entry(@file).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FileExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Files
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754

        // Call function in submission engine
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<List<UpladedFile>>> UploadFiles(List<IFormFile> files)
        {
            // Check if the number of files exceeds 100
            if (files.Count > 100)
            {
                return BadRequest("You can upload a maximum of 100 files at once.");
            }

            Console.WriteLine($"the length of files is: {files.Count}");
            List<UpladedFile> filesLinks = new List<UpladedFile> { };

            // Validate and process each file
            foreach (var file in files)
            {
                // Validate file extension (e.g., allow only images and videos)
                var allowedExtensionsphoto = new[] { ".jpg", ".jpeg", ".png", ".raw", ".arw" };
                var allowedExtensionsvideo = new[] { ".mp4" };
                // to be supported: .tiff, .jpg, .gif, .mov
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensionsphoto.Contains(fileExtension) && !allowedExtensionsvideo.Contains(fileExtension))
                {
                    return BadRequest($"File {file.FileName} has an unsupported file type.");
                }

                // Validate file size (e.g., 500MB limit)
                if (file.Length > 500 * 1024 * 1024) // 100MB
                {
                    return BadRequest($"File {file.FileName} exceeds the maximum allowed size.");
                }

                var id = Guid.NewGuid();

                var fileName = string.Concat("Original_", id.ToString(), fileExtension);
                // Save the file to the upload directory
                using var stream = file.OpenReadStream();
                string fileUrlOriginal = await _azureBlobService.UploadAsync(file, fileName, ContainerType.Palette);


                // generate thumbnail
                SubmissionEngine submissionEngine = new SubmissionEngine();
                var thumbnail = await submissionEngine.GenerateThumbnail(file);
                var fileExtensionThumbnail = Path.GetExtension(thumbnail.FileName).ToLowerInvariant();
                // do the same upload for thumbnail
                var fileNameThumbnail = string.Concat("Thumbnail_", id.ToString(), fileExtensionThumbnail);
                // Save the thumbnail to the thumbnail directory
                using var streamthumbnail = thumbnail.OpenReadStream();
                string fileUrlThumbnail = await _azureBlobService.UploadThumbnailAsync(thumbnail, fileNameThumbnail);
                
                Console.WriteLine(fileUrlOriginal);
                Console.WriteLine(fileUrlThumbnail);

                var uploadedFile = ProcessImageToExif(file);
                uploadedFile.ThumbnailPath = fileUrlThumbnail;
                uploadedFile.OriginalPath = fileUrlOriginal;
                uploadedFile.ViewPath = fileUrlOriginal;

                filesLinks.Add(uploadedFile);
            }

            return Ok(filesLinks);
        }

        // Call function in submission engine
        [HttpPost("upload/edited")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<List<UpladedFile>>> UploadFile()
        {
            var files = Request.Form.Files;
            var originalUrl = Request.Form["originalurl"].ToString();

            if (files.Count != 1 || string.IsNullOrWhiteSpace(originalUrl))
                return BadRequest("One file and originalurl must be provided.");

            var file = files[0];
            var fileExt = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".raw", ".arw", ".mp4" };

            if (!allowedExtensions.Contains(fileExt))
                return BadRequest($"Unsupported file type: {fileExt}");

            if (file.Length > 500 * 1024 * 1024)
                return BadRequest("File size exceeds limit.");

            var existingFile = await _context.Files.FirstOrDefaultAsync(f => f.OriginalPath == originalUrl);
            if (existingFile == null)
                return NotFound("Original file not found in database.");

            Console.WriteLine("Upload/edited endpoint hit!");
            // Delete old blob & thumbnail
            await _azureBlobService.DeleteAsync(existingFile.OriginalPath);
            if (!string.IsNullOrEmpty(existingFile.ThumbnailPath))
                await _azureBlobService.DeleteThumbnailAsync(existingFile.ThumbnailPath);

            // Upload new file & thumb
            var newId = Guid.NewGuid();
            var newFileName = $"Original_{newId}{fileExt}";
            using var stream = file.OpenReadStream();
            string newOriginalUrl = await _azureBlobService.UploadAsync(file, newFileName, ContainerType.Palette);

            var engine = new SubmissionEngine();
            var thumb = await engine.GenerateThumbnail(file);
            var thumbExt = Path.GetExtension(thumb.FileName).ToLowerInvariant();
            var thumbName = $"Thumbnail_{newId}{thumbExt}";
            using var thumbStream = thumb.OpenReadStream();
            string newThumbUrl = await _azureBlobService.UploadThumbnailAsync(thumb, thumbName);

            // Update DB
            existingFile.OriginalPath = newOriginalUrl;
            existingFile.ThumbnailPath = newThumbUrl;
            existingFile.DateTimeOriginal = DateTime.UtcNow;

            _context.Files.Update(existingFile);
            await _context.SaveChangesAsync();

            return Ok(new List<UpladedFile> {
                new UpladedFile {
                    OriginalPath = newOriginalUrl,
                    ThumbnailPath = newThumbUrl
                }
            });
        }

        [HttpPost]
        public async Task<ActionResult<List<FileModel>>> AddFiles(List<FileDTO> files)
        {
            // Check if the number of files exceeds 100
            if (files.Count > 100)
            {
                return BadRequest("You can upload a maximum of 100 files at once.");
            }

            if (files.Count == 0)
            {
                return BadRequest("No file to save.");
            }

            var existingFiles = findExistingFiles(files);
            var existingFilePaths = existingFiles.Select(f => f.OriginalPath);
            var newFiles = files.Where(file => !existingFilePaths.Contains(file.filePath));

            var savedFiles = new List<FileModel> { };

            foreach (var file in newFiles)
            {

                var tagsExists = new List<String> { };
                var tagsDoNotExists = new List<String> { };
                var existingTags = new List<TagBasicModel> { };
                var user = _context.Users.Find(file.userId);
                if (user == null)
                {
                    return BadRequest(string.Concat("User with id = ", file.userId, " not found"));
                }

                var updatedPath = file.filePath;
                var dimensions = FileEngine.GetDimensions(file.filePath);

                foreach (var tag in file.metadata)
                {
                    bool exists = await TagExistsAsync(tag);
                    if (exists)
                    {
                        tagsExists.Add(tag);
                    }
                    else
                    {
                        tagsDoNotExists.Add(tag);
                    }
                }

                existingTags = await _context.BasicTags
                    .Where(t => tagsExists.Contains(t.Value))
                    .ToListAsync();

                var newTags = tagsDoNotExists
                    .Where(t => !existingTags.Any(et => et.Value == t))
                    .Select(t => new TagBasicModel { Value = t })
                    .ToHashSet();

                FileModel fileModel = new FileModel
                {
                    Name = Path.GetFileName(new Uri(file.filePath).LocalPath),
                    Extension = Path.GetExtension(new Uri(file.filePath).LocalPath),
                    Description = "",
                    ThumbnailPath = file.thumbnailPath,
                    ViewPath = file.viewPath,
                    OriginalPath = updatedPath,
                    DateTimeOriginal = file.date,
//                    User = user,
                    UserId = file.userId,
//                    Project = project,
                    Palette = file.palette,
                    ProjectId = file.projectId,
                    PixelHeight = file.pixelHeight,
                    PixelWidth = file.pixelWidth,
                    bTags = newTags,
                    Resolution = file.resolution,
                    Location = file.location,
                    Aperture = file.aperture,
                    Copyright = file.copyright,
                    FocalLength = file.focalLength,
                    GPSAlt = file.gpsAlt,
                    GPSLat = file.gpsLat,
                    GPSLon = file.gpsLon,
                    Make = file.make,
                    Model = file.model
                };

                _context.Files.Add(fileModel);

                await _context.SaveChangesAsync();

                foreach (var tag in existingTags)
                {
                    _context.FileTags.Add(new FileTag
                    {
                        FileId = fileModel.Id,
                        TagId = tag.Value
                    });
                }
                await _context.SaveChangesAsync();

                savedFiles.Add(fileModel);

            }


            foreach (var existingFile in existingFiles)
            {
                var tagsExists = new List<String> { };
                var tagsDoNotExists = new List<String> { };
                var existingTags = new List<TagBasicModel> { };

                var fileDto = files.First(f=> f.filePath == existingFile.OriginalPath);
                foreach (var tag in fileDto.metadata)
                {
                    bool exists =  await TagExistsAsync(tag);

                    if (exists && !existingFile.bTags.Any(t => t.Value == tag))
                    {
                        tagsExists.Add(tag);
                    }
                    else
                    {
                        tagsDoNotExists.Add(tag);
                    }
                }

                existingTags = await _context.BasicTags
                    .Where(t => tagsExists.Contains(t.Value))
                    .ToListAsync();

                var newTags = tagsDoNotExists
                    .Where(t => !existingTags.Any(et => et.Value == t))
                    .Select(t => new TagBasicModel { Value = t })
                    .ToHashSet();


                existingFile.Location = fileDto.location;
                existingFile.Resolution = fileDto.resolution;
                existingFile.DateTimeOriginal = fileDto.date;
                existingFile.ProjectId = fileDto.projectId;

                await _context.SaveChangesAsync();

                _context.BasicTags.AddRange(newTags);

                await _context.SaveChangesAsync();

                foreach (var tag in existingTags)
                {
                    _context.FileTags.Add(new FileTag
                    {
                        FileId = existingFile.Id,
                        TagId = tag.Value
                    });
                }
                foreach (var tag in newTags)
                {
                    _context.FileTags.Add(new FileTag
                    {
                        FileId = existingFile.Id,
                        TagId = tag.Value
                    });
                }
                await _context.SaveChangesAsync();

                savedFiles.Add(existingFile);
            }

            var savedFileIds = savedFiles.Select(f => f.Id).ToList();

            var filesWithTags = await _context.Files
                .Where(f => savedFileIds.Contains(f.Id))
                .Include(f => f.bTags) // Ensure tags are loaded
                .ToListAsync();

            return Ok(filesWithTags);
        }



        private async Task<bool> TagExistsAsync(string tagValue)
        {
            return await _context.BasicTags.AnyAsync(t => t.Value == tagValue);
        }

        private void deleteFilesFromPalette(List<FileDTO> files)
        {
            var dtoFilePaths = files
                    .Where(file => file.palette)
                    .Select(file => file.filePath)
                    .ToList();

            var filesToDelete = _context.Files
                .Where(f => f.UserId == files[0].userId && f.Palette && dtoFilePaths.Contains(f.OriginalPath))
                .ToList();
            if (filesToDelete.Any())
            {
                // Get all related FileTags
                var fileIds = filesToDelete.Select(f => f.Id).ToList();
                var fileTagsToDelete = _context.FileTags.Where(ft => fileIds.Contains(ft.FileId));

                // Remove FileTags first
                _context.FileTags.RemoveRange(fileTagsToDelete);
                _context.SaveChanges();

                // Now remove Files
                _context.Files.RemoveRange(filesToDelete);
                _context.SaveChanges();
            }
        }

        private List<FileModel> findExistingFiles(List<FileDTO> files){
                var dtoFilePaths = files
                    .Select(file => file.filePath)
                    .ToList();

            var existingFiles = _context.Files
                .Where(f => f.UserId == files[0].userId && f.Palette && dtoFilePaths.Contains(f.OriginalPath))
                .ToList();

            return existingFiles;
        }

        // DELETE: api/Files/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFile(int id)
        {
            var @file = await _context.Files.FindAsync(id);
            if (@file == null)
            {
                return NotFound();
            }

            _context.Files.Remove(@file);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool FileExists(int id)
        {
            return _context.Files.Any(e => e.Id == id);
        }




        [HttpPost("download-zip")]
        public async Task<IActionResult> DownloadFilesAsZip([FromBody] List<string> fileNames)
        {
            if (fileNames == null || fileNames.Count == 0)
            {
                return BadRequest("No files specified for download.");
            }

            var containerClient = _azureBlobService.ProjectsContainer;
            using (var memoryStream = new MemoryStream())
            {
                using (var zipArchive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    foreach (var fileName in fileNames)
                    {
                        var blobClient = containerClient.GetBlobClient(fileName);

                        if (await blobClient.ExistsAsync())
                        {
                            var zipEntry = zipArchive.CreateEntry(fileName,
                                System.IO.Compression.CompressionLevel.Fastest);
                            using (var entryStream = zipEntry.Open())
                            using (var blobStream = await blobClient.OpenReadAsync())
                            {
                                await blobStream.CopyToAsync(entryStream);
                            }
                        }
                    }
                }

                memoryStream.Seek(0, SeekOrigin.Begin);
                return File(memoryStream.ToArray(), "application/zip", "DownloadedFiles.zip");
            }
        }


        // POST: api/files/uploadToProject/{pid}/{selectedResolution}/{userid}

        // Sample input: [102, 103, 104]
        // add userid input

        [HttpPost("uploadToProject/{pid}/{selectedResolution}/{userid}")]
        public async Task<IActionResult> UploadToProject([FromBody] List<int> fids, int pid, string selectedResolution, int userid)
        {
            var project = await _context.Projects
                .Include(p => p.Files)
                .FirstOrDefaultAsync(p => p.Id == pid);
        
            if (project == null)
            {
                return NotFound("No project found.");
            }
            
            if (project.Status != "Active" && project.Status != "active") 
            {
                return BadRequest("Cannot upload image. Project is not in a valid state.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userid);

            if (user == null)
            {
                return NotFound("User does not exist.");
            }

            var hasAccess = await _context.UserProjectRelations
                .FirstOrDefaultAsync(upr => upr.ProjectId == pid && upr.UserId == userid);

            if (hasAccess == null)
            {
                return BadRequest("User does not have access to this project");
            }
        
            var files = await _context.Files
                .Where(f => fids.Contains(f.Id) && f.Palette)
                .ToListAsync();
        
            foreach (var file in files)
            {
                // Move the original file to the project container
                var updatedPath = await _azureBlobService.MoveBlobWithinContainerAsync(
                    "palettes",
                    Path.GetFileName(new Uri(file.OriginalPath).LocalPath),
                    "projects"
                );
        
                file.ProjectId = pid;
                file.Palette = false;
                file.OriginalPath = updatedPath;
        
                var resolution = selectedResolution?.Trim().ToLower();
        
                if (resolution == "low")
                {
                    // ✅ Keep existing thumbnail
                }
                else if (resolution == "medium")
                {
                    // ❗ Delete the existing thumbnail from blob storage
                    await _azureBlobService.DeleteThumbnailAsync(file.ThumbnailPath);

                    // ❗ Download original from updatedPath, compress to medium, and upload to thumbnail location
                    var originalImage = await _azureBlobService.GetFormFileFromUrlAsync(file.OriginalPath);
                    // compress it to medium
                    var compressedMediumImage = await _submissionEngine.CompressImage(originalImage);
                    // put it back to thumbnail
                    var newIdThumbnail = Guid.NewGuid();
                    var thumbnailNameTemp = Path.GetExtension(compressedMediumImage.FileName).ToLowerInvariant();
                    var thumbNameFix = $"Thumbnail_{newIdThumbnail}{thumbnailNameTemp}";
                    using var thumbStreamMedium = compressedMediumImage.OpenReadStream();
                    string newThumbUrlMedium = await _azureBlobService.UploadThumbnailAsync(compressedMediumImage, thumbNameFix);
                    // string newThumbnailPath = await _imageService.CompressToMediumAsync(updatedPath);
                    file.ThumbnailPath = newThumbUrlMedium;
                }
                else if (resolution == "high")
                {
                    // ❗ Delete the existing thumbnail from blob storage
                    await _azureBlobService.DeleteThumbnailAsync(file.ThumbnailPath);
                    
                    var extension = Path.GetExtension(file.OriginalPath).ToLowerInvariant();

                    if (extension == ".jpg" || extension == ".jpeg" || extension == ".png")
                    {
                        // ✅ Copy original to thumbnail for image types
                        file.ThumbnailPath = file.OriginalPath;
                    }
                    else // for raw and video case
                    {
                        // ❗ Delete the existing thumbnail from blob storage
                        await _azureBlobService.DeleteThumbnailAsync(file.ThumbnailPath);

                        // ❗ Download original from updatedPath, compress to medium, and upload to thumbnail location
                        var originalImage = await _azureBlobService.GetFormFileFromUrlAsync(file.OriginalPath);
                        // compress it to high
                        var compressedHighImage = await _submissionEngine.CompressImageHigh(originalImage);
                        // put it back to thumbnail
                        var newIdThumbnail = Guid.NewGuid();
                        var thumbnailNameTemp = Path.GetExtension(compressedHighImage.FileName).ToLowerInvariant();
                        var thumbNameFix = $"Thumbnail_{newIdThumbnail}{thumbnailNameTemp}";
                        using var thumbStreamHigh= compressedHighImage.OpenReadStream();
                        string newThumbUrlHigh = await _azureBlobService.UploadThumbnailAsync(compressedHighImage, thumbNameFix);
                        // pass it to thumbnail path
                        file.ThumbnailPath = newThumbUrlHigh;
                    }
                }
                else
                {
                    return BadRequest("Invalid resolution specified.");
                }
        
                project.Files.Add(file);
            }
        
            await _context.SaveChangesAsync();
        
            return Ok("Files uploaded successfully.");
        }


        [HttpPost("delete-files")]
        public async Task<IActionResult> DeleteFiles([FromBody] List<string> fileNames)
        {
            if (fileNames == null || fileNames.Count == 0)
            {
                return BadRequest("No files specified for deletion.");
            }

            try
            {
              // Assuming _azureBlobService.ProjectsContainer returns the BlobContainerClient
              var containerClient = _azureBlobService.ProjectsContainer;

              foreach (var fileName in fileNames)
              {
                  var blobClient = containerClient.GetBlobClient(fileName);
                  // Delete the blob if it exists
                  await blobClient.DeleteIfExistsAsync();
              }

              return Ok("Files deleted successfully.");
          }
          catch (Exception ex)
          {
              return StatusCode(500, $"Error deleting files: {ex.Message}");
          }
      }

      [HttpPost("delete-files-db")]
      public async Task<IActionResult> DeleteFilesDB([FromBody] List<int> fileIds)
      {
          if (fileIds == null || fileIds.Count == 0)
          {
              return BadRequest("No file IDs provided for deletion.");
          }

          foreach (var id in fileIds)
          {
              var file = await _context.Files.FindAsync(id);
              if (file != null)
              {
                  _context.Files.Remove(file);
              }
          }

          try
          {
              await _context.SaveChangesAsync();
              return Ok("Files deleted successfully.");
          }
          catch (Exception ex)
          {
              return StatusCode(500, $"Error deleting files from database: {ex.Message}");
          }
      }

                    private UpladedFile ProcessImageToExif(IFormFile imageFile)
                         {
                             string originalPath = "not for now";
                             string viewPath = "not for now";
                             string thumbnailPath = "not for now";

                             var fileModel = new UpladedFile
                             {
//                                 Name = Path.GetFileNameWithoutExtension(imageFile.FileName),
//                                 Extension = Path.GetExtension(imageFile.FileName),
                                 ThumbnailPath = thumbnailPath,
//                                 ViewPath = viewPath,
                                 OriginalPath = originalPath,
                                 PixelWidth = 0,
                                 PixelHeight = 0,

                             };
                             
                             var allowedExtension = new[] { ".jpg", ".jpeg", ".png"};
                             var fileExtension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();
                             if (!allowedExtension.Contains(fileExtension))
                             {
                                 return fileModel;
                             }

                             using (var stream = imageFile.OpenReadStream())
                             using (var image = SixLabors.ImageSharp.Image.Load(stream))
                             {
                                Console.WriteLine("Going to extract exif :::::::::::::::::::::;");
                                 fileModel.PixelWidth = image.Width;
                                 fileModel.PixelHeight = image.Height;
//                                 fileModel.Palette = true;

                                 var exifProfile = image.Metadata.ExifProfile;
                                 if (exifProfile != null)
                                 {
                                    Console.WriteLine("Going to extract exif inside if:::::::::::::::::::::;");
                                     ExtractExifMetadata(exifProfile, fileModel);
                                 }
                             }

                             return fileModel;
                         }


      private UpladedFile ExtractExifMetadata(ImageSharpExif.ExifProfile exifProfile, UpladedFile fileModel)
              {
                  object? latRef = null;
                  object? lonRef = null;

                  foreach (var tag in exifProfile.Values)
                  {
                      if (tag.Tag == ImageSharpExifTag.GPSLatitudeRef)
                      {
                          latRef = tag.GetValue();
                      }
                      else if (tag.Tag == ImageSharpExifTag.GPSLongitudeRef)
                      {
                          lonRef = tag.GetValue();
                      }
                      else if (tag.Tag == ImageSharpExifTag.GPSLatitude)
                      {
                          fileModel.GPSLat = ConvertDMSToDecimal(tag.GetValue(), latRef?.ToString());
                      }
                      else if (tag.Tag == ImageSharpExifTag.GPSLongitude)
                      {
                          fileModel.GPSLon = ConvertDMSToDecimal(tag.GetValue(), lonRef?.ToString());
                      }
                      else if (tag.Tag == ImageSharpExifTag.GPSAltitude &&
                               tag.GetValue() is SixLabors.ImageSharp.Rational altitudeRational)
                      {
                          fileModel.GPSAlt = (decimal)altitudeRational.ToDouble();
                      }
                      else if (tag.Tag == ImageSharpExifTag.Make)
                      {
                          fileModel.Make = tag.GetValue()?.ToString();
                      }
                      else if (tag.Tag == ImageSharpExifTag.Model)
                      {
                          fileModel.Model = tag.GetValue()?.ToString();
                      }
                      else if (tag.Tag == ImageSharpExifTag.Copyright)
                      {
                          fileModel.Copyright = tag.GetValue()?.ToString();
                      }
                      else if (tag.Tag == ImageSharpExifTag.FocalLength)
                      {
                          if (tag.GetValue() is SixLabors.ImageSharp.Rational rational)
                          {
                              fileModel.FocalLength = (int)rational.ToDouble();
                          }
                      }
                      else if (tag.Tag == ImageSharpExifTag.FNumber)
                      {
                          if (tag.GetValue() is SixLabors.ImageSharp.Rational rational)
                          {
                              fileModel.Aperture = (float)rational.ToDouble();
                          }
                      }
                  }
                  return fileModel;
              }
               private decimal? ConvertDMSToDecimal(object dmsValue, string? reference)
                      {
                          if (dmsValue is SixLabors.ImageSharp.Rational[] dmsArray && dmsArray.Length == 3)
                          {
                              decimal degrees = (decimal)dmsArray[0].ToDouble();
                              decimal minutes = (decimal)dmsArray[1].ToDouble();
                              decimal seconds = (decimal)dmsArray[2].ToDouble();

                              decimal decimalDegrees = degrees + (minutes / 60) + (seconds / 3600);

                              if (reference == "S" || reference == "W")
                              {
                                  decimalDegrees = -decimalDegrees;
                              }

                              return decimalDegrees;
                          }

                          return null;
                      }

}

}
//}

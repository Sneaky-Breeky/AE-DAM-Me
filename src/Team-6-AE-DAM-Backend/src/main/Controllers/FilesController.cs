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

namespace DAMBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FilesController : ControllerBase
    {
        private readonly AzureBlobService _azureBlobService;
        private readonly SQLDbContext _context;

        public FilesController(SQLDbContext context, AzureBlobService azureBlobService)
        {
            _context = context;
            _azureBlobService = azureBlobService;
        }

        // GET: api/Files
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FileModel>>> GetFiles()
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
        
        /*
         * Must be called with AddFiles
         * Example FileDTO
         * [
              {
                "date": "2024-03-25T12:30:00Z",
                "metadata": ["tag1", "tag2"],
                "projectId": 123,
                "location": "New York",
                "filePath": "https://example.com/image1.jpg",
                "userId": 456,
                "palette": true,
                "resolution": "High"
              }
            ]
         */

        // POST: api/Files/upload
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<List<FileModel>>> UploadFiles(List<IFormFile> files)
        {
            // Check if the number of files exceeds 100
            if (files.Count > 100)
            {
                return BadRequest("You can upload a maximum of 100 files at once.");
            }
            Console.WriteLine("the length of files is: ", files.Count);
            List<string> filesLinks = new List<string> { };

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
                string fileUrl = await _azureBlobService.UploadAsync(file, fileName, ContainerType.Palette);
                filesLinks.Add(fileUrl);
            }
            return Ok(filesLinks);
        }

        // POST: api/Files
        [HttpPost]
        public async Task<ActionResult<List<FileModel>>> AddFiles(List<FileDTO> files)
        {
            // Check if the number of files exceeds 100
            if (files.Count > 100) 
            {
                return BadRequest("You can upload a maximum of 100 files at once.");
            }
            var savedFiles = new List<FileModel> { };
            foreach (var file in files)
            {

                var project = _context.Projects.Find(file.projectId);
                if (project == null)
                {
                    return BadRequest(string.Concat("Project with id = ", file.projectId, " not found"));
                }
                var user = _context.Users.Find(file.userId);
                if (user == null)
                {
                    return BadRequest(string.Concat("User with id = ", file.userId, " not found"));
                }


                var updatedPath = file.filePath;
                if (!file.palette)
                {
                    updatedPath = await _azureBlobService.MoveBlobWithinContainerAsync("palettes", Path.GetFileName(new Uri(file.filePath).LocalPath), "projects");
                }
                var dimensions = FileEngine.GetDimensions(file.filePath);

                FileModel fileModel = new FileModel
                {
                    // Id assigned automatically on backend
                    // Id = _context.Files
                    //                     .Select(f => f.Id)
                    //                     .AsEnumerable()
                    //                     .DefaultIfEmpty(0)
                    //                     .Max(),
                    Name = Path.GetFileName(new Uri(file.filePath).LocalPath),
                    Extension = Path.GetExtension(new Uri(file.filePath).LocalPath),
                    Description = "",
                    ThumbnailPath = updatedPath,
                    ViewPath = updatedPath,
                    OriginalPath = updatedPath,
                    DateTimeOriginal = file.date,
                    User = user,
                    UserId = file.userId,
                    Project = project,
                    Palette = file.palette,
                    ProjectId = file.projectId,
                    bTags = file.metadata
                                .Where(t => !string.IsNullOrWhiteSpace(t))
                                .Select(t => new TagBasicModel { Value = t })
                                .ToHashSet(),
                    PixelHeight = dimensions.HasValue ? dimensions.Value.Height : 0,
                    PixelWidth = dimensions.HasValue ? dimensions.Value.Width : 0
                };
                _context.Files.Add(fileModel);
                savedFiles.Add(fileModel);
            }
            return Ok(savedFiles);
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
    }
}
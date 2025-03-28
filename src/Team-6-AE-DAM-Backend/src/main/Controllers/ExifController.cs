using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DAMBackend.Data;
using DAMBackend.Models;
using DAMBackend.services;
 using DAMBackend.Engine;

namespace DAMBackend.Controllers
{
    [Route("api/exif")]
    [ApiController]
    public class ExifController : ControllerBase
    {
        private readonly SQLDbContext _context;

        public ExifController(SQLDbContext context)
        {
            _context = context;
        }

        [HttpPost("upload")]
        public async Task<ActionResult<List<FileModel>>> UploadFiles([FromForm] List<IFormFile> files, [FromForm] int userId)
        {
            if (files == null || !files.Any())
            {
                return BadRequest(new { error = "No files were uploaded." });
            }

            var fileModels = new List<FileModel>();

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    try
                    {
                        var exifEngine = new ExifEngine(file, userId);
                        var fileModel = exifEngine.FileModelExif;
                        fileModels.Add(fileModel);
                        await _context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        return StatusCode(500, new { error = $"Failed to process {file.FileName}: {ex.Message}" });
                    }
                }
            }

            return Ok(fileModels);
        }
    }
}

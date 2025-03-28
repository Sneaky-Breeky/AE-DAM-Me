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
                 public async Task<IActionResult> UploadFiles([FromForm] List<IFormFile> files, [FromForm] int userId)
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
                                 // Process each file's EXIF data using ExifEngine
                                 var exifEngine = new ExifEngine(file, userId);
                                 var fileModel = exifEngine.FileModel;

                                 // Add the processed fileModel to the list
                                 fileModels.Add(fileModel);
                             }
                             catch (Exception ex)
                             {
                                 // Log the error and continue with the next file
                                 return StatusCode(500, new { error = $"Failed to process {file.FileName}: {ex.Message}" });
                             }
                         }
                     }
                     }
                     }
                     }



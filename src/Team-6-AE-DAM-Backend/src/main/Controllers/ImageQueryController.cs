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
     [ApiController]
     [Route("api/imageQuery")]
     public class ImageQueryController: ControllerBase
     {
         private readonly SQLDbContext _context;

         public ImageQueryController(SQLDbContext context)
         {
             _context = context;
         }

         [HttpGet("date/{startDate}/{endDate}")]
         public async Task<ActionResult<IEnumerable<FileModel>>> GetImagesByDate(DateTime startDate, DateTime endDate)
                  {
                  var query = _context.Files.AsQueryable();

                  if (startDate != DateTime.MinValue)
                              {
                                  query = query.Where(upr => upr.DateTimeOriginal >= startDate);
                              }

                  if (endDate != DateTime.MinValue)
                              {
                                  query = query.Where(upr => upr.DateTimeOriginal <= endDate);
                              }
                  var files = await query.ToListAsync();


                  return Ok(files);
                  }

         [HttpGet("metaDataTagsForImage/{pid}/{fid}")]
          public async Task<ActionResult<IEnumerable<string>>> ProjectMetadataTagsQuery(int pid, int fid)
          {
            var project = await _context.Projects.FindAsync(pid);
            if (project == null)
            {
              return NotFound("Project not found.");
                }
           var mTags = await _context.MetadataTags
           .Where(mt => _context.Files.Any(f => f.ProjectId == pid && f.Id == fid))
                                                                .Select(mt => mt.Key)
                                                                  .Distinct()
                                                                  .ToListAsync();

            return Ok(mTags);
            }
         [HttpGet("metaDataTagsValuesForImage/{pid}/{fid}")]
         public async Task<ActionResult<IEnumerable<object>>> ProjectMetadataTagsValuesQuery(int pid, int fid)
         {
             var file = await _context.Files.FirstOrDefaultAsync(f => f.Id == fid && f.ProjectId == pid);
             if (file == null)
             {
                 return NotFound("File not found.");
             }

             var mTags = await _context.MetadataTags
                 .Where(mt => mt.FileId == fid) 
                 .Select(mt => new 
                 {
                     Key = mt.Key,
                     sValue = mt.sValue ?? string.Empty,
                     iValue = mt.iValue,
                     type = mt.type
                 })
                 .ToListAsync();

             return Ok(mTags);
         }

          [HttpGet("basicTagsForImage/{pid}/{fid}")]
          public async Task<ActionResult<IEnumerable<string>>> ProjectBasicTagsQuery(int pid, int fid)
          {
            var project = await _context.Projects.FindAsync(pid);
            if (project == null)
            {
                        return NotFound("Project not found.");
            }
            var bTags = await _context.FileTags.Where(ft => ft.FileId == fid)
                                                .Select(ft => ft.TagId)
                                                .Distinct()
                                                .ToListAsync();

            return Ok(bTags);
             }

         }

         }
//         }
        // 1. search images by date
        // 2. search images by tags
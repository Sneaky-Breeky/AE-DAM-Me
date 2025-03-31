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
         }
         }
        // 1. search images by date
        // 2. search images by tags
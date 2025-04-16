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
     [Route("api/log")]
     [ApiController]
     public class LogController : ControllerBase
     {
         private readonly SQLDbContext _context;

         public LogController(SQLDbContext context)
         {
             _context = context;
         }

         [HttpGet("fetch/{userId}")]
         public async Task<ActionResult<IEnumerable<LogImage>>> GetLogForUser(int userId)
         {
             try
             {
                 var logs = await _context.LogImage
                     .Where(l => l.UserId == userId)
                     .ToListAsync();

                 return Ok(logs);

             }
             catch (Exception ex)
             {
                 return BadRequest(ex.Message);
             }

             
         }

         [HttpPost("addLog")]
         public async Task<ActionResult<LogImage>> AddLog([FromBody] LogImageRequest logRequest)
         {
             if (logRequest == null)
             {
                 return BadRequest(new { error = "Invalid log data" });
             }

             var log = new LogImage(logRequest.FileId,
                                    logRequest.ProjectId,
                                     logRequest.UserId,
                                     logRequest.TypeOfLog,
                                     DateTime.Now);
//                                     logRequest.LogDate);

             _context.LogImage.Add(log);
             await _context.SaveChangesAsync();

             return Ok(log);
         }

     [HttpGet("fetchProjectLog/{projectId}")]
              public async Task<ActionResult<IEnumerable<LogImage>>> GetLogForProject(int projectId)
              {
                  try
                  {
                      var logs = await _context.LogImage
                          .Where(l => l.ProjectId == projectId)
                          .ToListAsync();

                      return Ok(logs);

                  }
                  catch (Exception ex)
                  {
                      return BadRequest(ex.Message);
                  }


              }
              }

     public class LogImageRequest
     {
         public int? FileId { get; set; }
         public int? ProjectId { get; set; }
         public int UserId { get; set; }
         public string TypeOfLog { get; set; }
         public DateTime LogDate { get; set; }
     }
 }


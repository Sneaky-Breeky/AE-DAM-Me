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
         public async Task<ActionResult<IEnumerable<ProjectModel>>> GetProjectQueryResult()
         {

//             return Ok(new { data = logs });
         }



     public class ProjectQueryRequest
     {
         public string Status { get; set; }
         public string? Location { get; set; }
         public DateTime StartDate { get; set; }
     }
 }


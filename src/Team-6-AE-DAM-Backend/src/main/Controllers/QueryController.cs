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
     [Route("api/query")]
     public class QueryController : ControllerBase
     {
         private readonly SQLDbContext _context;

         public QueryController(SQLDbContext context)
         {
             _context = context;
         }
         [HttpGet("projectQuery/{status}/{location}/{startDate}/{endDate}")]
         public async Task<ActionResult<IEnumerable<ProjectModel>>> GetProjectQueryResult(string status, string location, DateTime startDate, DateTime endDate)
         {
         var query = _context.Projects.AsQueryable();
         if (!string.IsNullOrEmpty(status) && status != "null")
             {
                 query = query.Where(upr => upr.Status == status);
             }

         if (!string.IsNullOrEmpty(location) && location != "null")
             {
                 query = query.Where(upr => upr.Location == location);
             }
         if (startDate != DateTime.MinValue)
                     {
                         query = query.Where(upr => upr.StartDate >= startDate);
                     }

         if (endDate != DateTime.MinValue)
                     {
                         query = query.Where(upr => upr.StartDate <= endDate);
                     }
         var projects = await query.ToListAsync();

         return Ok(projects);
         }
 }
 }
// }

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
     public class QueryController : ControllerBase
     {
         private readonly SQLDbContext _context;

         public QueryController(SQLDbContext context)
         {
             _context = context;
         }

         public async Task<ActionResult<IEnumerable<ProjectModel>>> GetProjectQueryResult(ProjectQueryRequest projectRequest)
         {
         var projects = await _context.ProjectModel
                          .Where(upr => upr.Status == projectRequest.Status)
                          .Where(upr => upr.Location == projectRequest.Location)
                          .Where(upr => upr.StartDate == projectRequest.StartDate)
                          .ToListAsync();
         }
         }



     public class ProjectQueryRequest
     {
         public string Status { get; set; }
         public string? Location { get; set; }
         public DateTime StartDate { get; set; }
     }
 }


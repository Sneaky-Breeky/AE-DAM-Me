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
         if (projectRequest == null){
            return BadRequest("Invalid query request.");
         }
         var query = _context.Projects.AsQueryable();
         if (!string.IsNullOrEmpty(projectRequest.Status))
                     {
                         query = query.Where(upr => upr.Status == projectRequest.Status);
                     }
         if (!string.IsNullOrEmpty(projectRequest.Location))
                     {
                         query = query.Where(upr => upr.Location == projectRequest.Location);
                     }
         if (projectRequest.StartDate != DateTime.MinValue)
                     {
                         query = query.Where(upr => upr.StartDate >= projectRequest.StartDate);
                     }

         if (projectRequest.EndDate != DateTime.MinValue)
                     {
                         query = query.Where(upr => upr.StartDate <= projectRequest.EndDate);
                     }
         var projects = await query.ToListAsync();
         if (projects == null || !projects.Any())
                     {
                         return NotFound("No projects found matching the given criteria.");
                     }
         return Ok(projects);
         }
         }



     public class ProjectQueryRequest
     {
         public string Status { get; set; }
         public string? Location { get; set; }
         public DateTime StartDate { get; set; } = DateTime.MinValue;
         public DateTime EndDate { get; set; } = DateTime.MinValue;
     }
 }


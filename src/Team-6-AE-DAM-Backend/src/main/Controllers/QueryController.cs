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
         [HttpGet("projectQuery")]
         public async Task<ActionResult<IEnumerable<ProjectModel>>> GetProjectQueryResult(string status, string location, DateTime startDate, DateTime endDate)
         {
         if (projectRequest == null){
            return BadRequest("Invalid query request.");
         }
         var query = _context.Projects.AsQueryable();
         if (!string.IsNullOrEmpty(status))
                     {
                         query = query.Where(upr => upr.Status == status);
                     }
         if (!string.IsNullOrEmpty(location))
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
         if (projects == null || !projects.Any())
                     {
                         return NotFound("No projects found matching the given criteria.");
                     }
         return Ok(projects);
         }
         // Query projects based on image tags
         // get all images that contain the tag
         // show all the projects associated wth those images
         [HttpGet("projectImageQuery")]
         public async Task<ActionResult<IEnumerable<ProjectModel>>> GetProjectQueryResult(string imageTag){

             var imageFileQuery = _context.Files
//                                             .Where(fm => fm.bTags.Contains(imageTag.Value))
                                             .Select(fm => fm.ProjectId);

             var projectIds = await imageFileQuery.ToListAsync();
             if (projectIds == null || !projectIds.Any())
                 {
                     return NotFound("No images found with this tag.");
                 }
             var projectsQuery = _context.Projects.Where(p => projectIds.Contains(p.Id));
             var projects = await projectsQuery.ToListAsync();
             if (projects == null || !projects.Any())
                 {
                     return NotFound("No projects found matching the image tag.");
                 }
             return Ok(projects);

         }
         }

     // public class ProjectQueryRequest
     // {
     //     public string Status { get; set; }
     //     public string? Location { get; set; }
     //     public DateTime StartDate { get; set; } = DateTime.MinValue;
     //     public DateTime EndDate { get; set; } = DateTime.MinValue;
     // }
 }

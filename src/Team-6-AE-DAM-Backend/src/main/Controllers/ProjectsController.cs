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
    [Route("api/Projects")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        private readonly SQLDbContext _context;

        public ProjectsController(SQLDbContext context)
        {
            _context = context;
        }

        private static List<ProjectModel> _projects = new List<ProjectModel>();

        private SQLEntryEngine engine;

        // POST response for api/Projects"
        [HttpPost]
        public async Task<ActionResult<ProjectModel>> PostProject([FromBody] ProjectModel projectData)
        {
            engine = new SQLEntryEngine(_context);
            if (projectData == null)
            {
                return BadRequest("Invalid project data.");
            }

            // You can now pass the incoming data to the addProject method
            var newProject = await engine.addProject(
                projectData.Name,
                projectData.Status,
                projectData.Location,
                projectData.ImagePath,
                projectData.Phase,
                projectData.AccessLevel,
                projectData.LastUpdate,
                projectData.Description
            );

            // Store the new project to the list or your database
            // _projects.Add(newProject);

            // Return a success response with the created project
            return CreatedAtAction(nameof(PostProject), new { id = newProject.Name }, newProject);
        }
        

        // GET: api/Projects/AccessList/{id}
        
        [HttpGet("AccessList/{userId}")]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects(int userId)
        {
            var projects = await _context.UserFavouriteProjects
                .Where(ufp => ufp.UserId == userId)
                .Select(ufp => ufp.Project)
                .ToListAsync();
            
            return Ok(new { data = projects });
        }

    //     // GET: api/Projects/5
    //     [HttpGet("{id}")]
    //     public async Task<ActionResult<Project>> GetProject(int id)
    //     {
    //         var projects = await _context.Projects.FindAsync(id);

    //         if (projects == null)
    //         {
    //             return NotFound();
    //         }

    //         return Ok(projects);
    //     }

    //     // PUT: api/Projects/5
    //     // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    //     [HttpPut("{id}")]
    //     public async Task<IActionResult> PutProject(Guid id, Project project)
    //     {
    //         if (id != project.Id)
    //         {
    //             return BadRequest();
    //         }

    //         _context.Entry(project).State = EntityState.Modified;

    //         try
    //         {
    //             await _context.SaveChangesAsync();
    //         }
    //         catch (DbUpdateConcurrencyException)
    //         {
    //             if (!ProjectExists(id))
    //             {
    //                 return NotFound();
    //             }
    //             else
    //             {
    //                 throw;
    //             }
    //         }

    //         return NoContent();
    //     }

    //     // POST: api/Projects
    //     // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    //     [HttpPost]
    //     public async Task<ActionResult<ProjectModel>> PostProject(ProjectModel projectmodel)
    //     {
    //         _context.Projects.Add(projectmodel);
    //         await _context.SaveChangesAsync();

    //         return CreatedAtAction("GetProject", new { id = projectmodel.Id }, projectmodel);
    //     }

    //     // DELETE: api/Projects/5
    //     [HttpDelete("{id}")]
    //     public async Task<IActionResult> DeleteProject(int id)
    //     {
    //         var project = await _context.Projects.FindAsync(id);
    //         if (project == null)
    //         {
    //             return NotFound();
    //         }

    //         _context.Projects.Remove(project);
    //         await _context.SaveChangesAsync();

    //         return NoContent();
    //     }

    //     private bool ProjectExists(Guid id)
    //     {
    //         return _context.Projects.Any(e => e.Id == id);
    //     }
    }
}

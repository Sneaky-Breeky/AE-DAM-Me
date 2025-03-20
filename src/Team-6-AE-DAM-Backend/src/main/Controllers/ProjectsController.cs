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
    [Route("api/projects")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        private readonly SQLDbContext _context;

        public ProjectsController(SQLDbContext context)
        {
            _context = context;
        }

        // GET: api/Projects
        [HttpGet("")]
        public async Task<ActionResult<IEnumerable<ProjectModel>>> GetProjects()
        {
            var projects = _context.Projects.ToListAsync();
            return Ok(projects);
        }

        // POST response for api/Projects"
        [HttpPost]
        public async Task<ActionResult<ProjectModel>> PostProject([FromBody] ProjectModel projectData)
        {
            if (projectData == null)
            {
                return BadRequest("Invalid project data.");
            }

            var engine = new SQLEntryEngine(_context);

            // You can now pass the incoming data to the addProject method
            var newProject = await engine.addProject(
                projectData.Id,
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
            return CreatedAtAction(nameof(PostProject), new { id = newProject.Id }, newProject);
        }

        // DELETE: api/projects/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound();
            }

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        

        // GET: api/Projects/AccessList/{userId}
        
        [HttpGet("AccessList/{userId}")]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects(int userId)
        {
            var projects = await _context.UserFavouriteProjects
                .Where(ufp => ufp.UserId == userId)
                .Select(ufp => ufp.Project)
                .ToListAsync();
            
            return Ok(new { data = projects });
        }
        
        // POST: api/Projects/GiveAccess/{userId}/{pId}

        [HttpPost("AccessList/{userId}/{pId}")]
        public async Task<ActionResult<UserFavouriteProject>> GiveAccess(int userId, int pId)
        {
            var access = new UserFavouriteProject
            {
                UserId = userId,
                ProjectId = pId,
                IsFavourite = false
            };
            _context.UserFavouriteProjects.Add(access);
            await _context.SaveChangesAsync();
            
            return Ok(access);
        }

        // GET: api/Projects
        [HttpGet]
        public async Task<ActionResult<List<Project>>> GetAllProjects()
        {
            var projects = await _context.Projects.ToListAsync();

            if (projects == null)
            {
                return NotFound();
            }

            return Ok(projects);
        }
        
        
        // GET: api/Projects/id
        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);

            if (project == null)
            {
                return NotFound();
            }

            return Ok(project);
        }

        // PUT: api/Projects/{id}
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProject(int id, [FromBody] ProjectModel projectData)
        {
            
            if (id != projectData.Id)
            {
                return BadRequest("Project ID in URL does not match project ID in body.");
            }
            
            var currentProject = await _context.Projects.FindAsync(id);
            
            if (currentProject == null)
            {
                return NotFound();
            }

            _context.Entry(currentProject).CurrentValues.SetValues(projectData);
            currentProject.LastUpdate = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(500, "Error updating project.");
            }

            return NoContent();
        }

    

        // DELETE: api/Projects/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound();
            }

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        
        // POST: api/Projects/Tag
        /* Input format should be:
            {
              "ProjectId": 1,
              "Key": "TagName",
              "Value": "Hello" or 3902 // Depends on type
              "type": 0 // for String or 1 for "Integer", depending on the value type
            }
         
         */

        [HttpPost]

        public async Task<IActionResult> AddProjectTag(
            [FromQuery] int ProjectId, 
            [FromQuery] string Key, 
            [FromQuery] object Value, 
            [FromQuery] value_type type)
        {
            
            var engine = new SQLEntryEngine(_context);
            
            var project = await _context.Projects.FindAsync(ProjectId);
            
            if (project == null)
            {
                return NotFound();
            }

            try
            {
                var tag = engine.addProjectTag(
                    project,
                    Key,
                    Value,
                    type
                );
                return Ok(tag);
            }
            catch (ArgumentException ex)
            {
                // Handle the specific exception and return a meaningful response to the client
                return BadRequest(ex.Message); // You can customize this message as needed
            }
            catch (Exception e)
            {
                return StatusCode(500, "An error occurred while processing your request.");
            }

            

        }
        
        // DELETE: api/Projects/Tags/{key}/{pId}
        [HttpDelete("{key}/{pId}")]
        public async Task<IActionResult> DeleteProject(string key, int pId)
        {
            var tag = await _context.ProjectTags
                .Where(pt => pt.Key == key && pt.ProjectId == pId)
                .FirstOrDefaultAsync();
            
            if (tag == null)
            {
                return NotFound(); 
            }
        
            _context.ProjectTags.Remove(tag);
            await _context.SaveChangesAsync();
        
            return NoContent();
        }
    }
}

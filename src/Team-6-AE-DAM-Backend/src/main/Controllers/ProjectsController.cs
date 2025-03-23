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
    [Route("api/damprojects")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        private readonly SQLDbContext _context;

        public ProjectsController(SQLDbContext context)
        {
            _context = context;
        }


        // POST response for api/Projects"
        [HttpPost("postproj")]
        public async Task<ActionResult<ProjectModel>> PostProject([FromBody] ProjectModel projectData)
        {
            if (projectData == null)
            {
                return BadRequest("Invalid project data.");
            }

            var engine = new SQLEntryEngine(_context);

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
            return CreatedAtAction(nameof(PostProject), new { id = newProject.Id }, newProject);
        }

        // DELETE: api/projects/{id}
        // [HttpDelete("{id}")]
        // public async Task<IActionResult> DeleteProject(int id)
        // {
        //     var project = await _context.Projects.FindAsync(id);
        //     if (project == null)
        //     {
        //         return NotFound();
        //     }

        //     _context.Projects.Remove(project);
        //     await _context.SaveChangesAsync();

        //     return NoContent();
        // }
        

        // GET: api/Projects/AccessList/{userId}
        
        [HttpGet("AccessList/{userId}")]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects(int userId)
        {
            var projects = await _context.UserProjectRelations
                .Where(upr => upr.UserId == userId)
                .Select(upr => upr.Project)
                .ToListAsync();
            
            return Ok(new { data = projects });
        }
        
        //POST
        [HttpPost("AccessList/{userId}/{pId}")]
        public async Task<ActionResult<UserProjectRelation>> GiveAccess(int userId, int pId)
        {
            // check if access already exists
            var existingRelation = await _context.UserProjectRelations
                .FirstOrDefaultAsync(rel => rel.UserId == userId && rel.ProjectId == pId);

            if (existingRelation != null)
            {
                return Ok(existingRelation);
            }
            var access = new UserProjectRelation
            {
                UserId = userId,
                ProjectId = pId,
                IsFavourite = false
            };
            _context.UserProjectRelations.Add(access);
            await _context.SaveChangesAsync();
            
            return Ok(access);
        }
        
        
        [HttpDelete("AccessList/{projectId}")]
        public async Task<IActionResult> RemoveAllAccessForProject(int projectId)
        {
            var existingRelations = _context.UserProjectRelations
                .Where(rel => rel.ProjectId == projectId);

            _context.UserProjectRelations.RemoveRange(existingRelations);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        
        // GET
        [HttpGet("{projectId}/users")]
        public async Task<ActionResult<IEnumerable<UserModel>>> GetUsersForProject(int projectId)
        {
            var users = await _context.UserProjectRelations
                .Where(ufp => ufp.ProjectId == projectId)
                .Select(ufp => ufp.User)
                .ToListAsync();

            if (!users.Any())
            {
                return NotFound(new { message = "No users found for this project." });
            }

            return Ok(users);
        }

        
        [HttpGet("FavProjects/{userId}")]
        public async Task<ActionResult<List<ProjectModel>>> GetFavProjects(int userId)
        {
            var projects = await _context.UserProjectRelations
                .Where(upr => upr.UserId == userId && upr.IsFavourite)
                .Select(upr => upr.Project)
                .ToListAsync();
            
            
            if (projects.Count == 0)
            {
                return NotFound("No fav projects found.");
            }
            
            return Ok(projects);
        }
        
        [HttpGet("WorkingProjects/{userId}")]
        public async Task<ActionResult<List<ProjectModel>>> GetWorkingProjects(int userId)
        {
            var projects = await _context.UserProjectRelations
                .Where(upr => upr.UserId == userId && upr.WorkingOn)
                .Select(upr => upr.Project)
                .ToListAsync();
            
            
            if (projects.Count == 0)
            {
                return NotFound("No working projects found.");
            }
            
            return Ok(projects);
        }

        // GET: api/Projects
        [HttpGet("getallprojs")]
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
        
        [HttpGet("{projectId}/tags")]
        public async Task<IActionResult> GetTagsForProject(int projectId)
        {
            var tags = await _context.ProjectTags
                .Where(tag => tag.ProjectId == projectId)
                .Select(tag => new
                {
                    tag.Key,
                    tag.sValue,
                    tag.iValue,
                    tag.type
                })
                .ToListAsync();

            return Ok(tags);
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

        [HttpPost("addprojtag")]
        public async Task<IActionResult> AddProjectTag(
            [FromQuery] int ProjectId, 
            [FromQuery] string Key, 
            [FromQuery] string Value, 
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
                var tag = await engine.addProjectTag(
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
                return StatusCode(500, $"An error occurred: {e.InnerException?.Message ?? e.Message} \n {e.StackTrace}");
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

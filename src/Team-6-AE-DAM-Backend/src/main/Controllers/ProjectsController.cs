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
using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using DAMBackend.blob;

namespace DAMBackend.Controllers
{
    [Route("api/damprojects")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        private readonly SQLDbContext _context;
        private readonly CsvEngine _csvService;
        private readonly AzureBlobService _azureBlobService;

        public ProjectsController(SQLDbContext context,CsvEngine csvService,AzureBlobService azureBlobService)
        {
            _context = context;
            _csvService = csvService;
            _azureBlobService = azureBlobService;
        }


        // POST response for api/damprojects"
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
                projectData.Description,
                projectData.StartDate
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


        // GET: api/damprojects/AccessList/{userId}
        [HttpGet("AccessList/{userId}")]
        public async Task<ActionResult<IEnumerable<ProjectModel>>> GetUserProjects(int userId)
        {
            var projects = await _context.UserProjectRelations
                .Where(upr => upr.UserId == userId)
                .Select(upr => upr.Project)
                .Where(p => EF.Functions.Like(p.Status, "Active"))
                .ToListAsync();

            return Ok(new { data = projects });
        }

        //POST
        [HttpPost("AccessList/{userId}/{pId}")]
        public async Task<ActionResult<UserProjectRelation>> GiveAccess(int userId, int pId)
        {
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


        [HttpPut("AccessList/favorite/{userId}/{projectId}")]
        public async Task<IActionResult> AddFavorite(int userId, int projectId)
        {
            var relation = await _context.UserProjectRelations
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ProjectId == projectId);

            if (relation == null)
                return NotFound("User does not have access to this project.");

            relation.IsFavourite = true;
            await _context.SaveChangesAsync();
            return Ok(new { projectId, isFavourite = true });
        }


        [HttpPut("AccessList/removefavorite/{userId}/{projectId}")]
        public async Task<IActionResult> RemoveFavorite(int userId, int projectId)
        {
            var relation = await _context.UserProjectRelations
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ProjectId == projectId);

            if (relation == null)
            {
                return NotFound("User does not have access to this project.");
            }

            relation.IsFavourite = false;
            await _context.SaveChangesAsync();

            return Ok(new { projectId, isFavourite = false });
        }


        [HttpGet("AccessList/FavProjects/{userId}")]
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


        [HttpPut("AccessList/workingon/{userId}/{projectId}")]
        public async Task<IActionResult> AddWorkingOn(int userId, int projectId)
        {
            var relation = await _context.UserProjectRelations
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ProjectId == projectId);

            if (relation == null)
                return NotFound("User does not have access to this project.");

            relation.WorkingOn = true;
            await _context.SaveChangesAsync();
            return Ok(new { projectId, workingOn = true });
        }



        [HttpPut("AccessList/removeworkingon/{userId}/{projectId}")]
        public async Task<IActionResult> RemoveWorkingOn(int userId, int projectId)
        {
            var relation = await _context.UserProjectRelations
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ProjectId == projectId);

            if (relation == null)
            {
                return NotFound("User does not have access to this project.");
            }

            relation.WorkingOn = false;
            await _context.SaveChangesAsync();

            return Ok(new { projectId, workingOn = false });
        }



        [HttpGet("AccessList/WorkingProjects/{userId}")]
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

        // GET: api/damprojects/getallprojs
        [HttpGet("getallprojs")]
        public async Task<ActionResult<List<ProjectModel>>> GetAllProjects()
        {
            var projects = await _context.Projects.ToListAsync();
            return Ok(projects);
        }


        // GET: api/damprojects/id
        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectModel>> GetProject(int id)
        {
            var project = await _context.Projects
                .Include(p => p.Tags)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (project == null)
            {
                return NotFound();
            }

            return Ok(project);
        }

        // PUT: api/damprojects/{id}
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProject(int id, [FromBody] ProjectModel projectData)
        {

            if (id != projectData.Id)
            {
                return BadRequest("Project ID in URL does not match project ID in body.");
            }

            var currentProject = await _context.Projects.Include(p => p.Tags).FirstOrDefaultAsync(p => p.Id == projectData.Id);

            if (currentProject == null)
            {
                return NotFound();
            }

            _context.Entry(currentProject).CurrentValues.SetValues(projectData);
            currentProject.LastUpdate = DateTime.UtcNow;
            

            // Track tags to be updated
            var tagsToUpdate = projectData.Tags.Where(updatedTag => currentProject.Tags
                    .Any(existingTag => existingTag.Key == updatedTag.Key 
                                        && (existingTag.iValue != updatedTag.iValue || existingTag.sValue != updatedTag.sValue)))
                .ToList();

            // Update existing tags
            foreach (var tagToUpdate in tagsToUpdate)
            {
                var existingTag = currentProject.Tags.First(t => t.Key == tagToUpdate.Key);
                
                existingTag.sValue = tagToUpdate.sValue;
                existingTag.iValue = tagToUpdate.iValue;
            }

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



        // DELETE: api/damprojects/{id}
        // remove images from the blob
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            
            if (project == null)
            {
                return NotFound();
            }
            
            var files = await _context.Files.Where(f => f.ProjectId == id).ToListAsync();
            
            if (files.Any())
            {
                _context.Files.RemoveRange(files);
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



        // POST: api/Projects/tag
        /* Input format should be:
            {
              "ProjectId": 1,
              "Key": "TagName",
              "Value": "Hello" or 3902 // Depends on type
              "type": 0 // for String or 1 for "Integer", depending on the value type
            }
         
         */
        [HttpPost("tag/add")]
        public async Task<IActionResult> AddProjectTag(
            [FromBody] ProjectTagDTO projectTagDTO)
        {

            var engine = new SQLEntryEngine(_context);

            var project = await _context.Projects.FindAsync(projectTagDTO.ProjectId);

            if (project == null)
            {
                return NotFound();
            }

            try
            {
                var tag = await engine.addProjectTag(
                    project,
                    projectTagDTO.Key,
                    projectTagDTO.Value,
                    projectTagDTO.Type
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


        // DELETE: api/damprojects/{key}/{pId}
        [HttpDelete("{key}/{pId}")]
        public async Task<IActionResult> DeleteProjectTag(string key, int pId)
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

        
        

        [HttpPost("postproj/bulk")]
        public async Task<ActionResult<List<ProjectModel>>> bulkUploadProjects(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            var records = new List<ProjectModel>();
            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HeaderValidated = null, // Disables missing header validation,
                MissingFieldFound = null // Ignores missing fields instead of throwing an error
            };
            using (var reader = new StreamReader(file.OpenReadStream()))
            using (var csv = new CsvReader(reader, config))
            {
                Console.WriteLine("Going To Read File");
                csv.Context.TypeConverterCache.AddConverter<List<string>>(new JsonListConverter());

                records = csv.GetRecords<ProjectModel>().ToList();
                Console.WriteLine("File Read");
            }

            if (records.Count == 0)
            {
                return BadRequest("No projects found");
            }

            List<ProjectModel> projects = new List<ProjectModel>();
            foreach (ProjectModel projectData in records)
            {
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
                        projectData.Description,
                        projectData.StartDate
                );
                projects.Add(newProject);
            }

            return Ok(projects);
        }

        [HttpGet("{id}/export")]
        public async Task<ActionResult<ProjectModel>> ExportProject(int id)
        {
            var project = _context.Projects
                            .FirstOrDefault(p => p.Id == id);
            ;

            if (project == null)
            {
                return NotFound();
            }
            var files = _context.Files
            .Where(f => f.ProjectId == id).ToList();
            var filePaths = files.Select(f => f.ViewPath).ToList();
            var url = await _csvService.GenerateCsvAndUploadAsync(project, files);
            return Ok(url);
        }

        [HttpGet("files/{pid}")]
        public async Task<ActionResult<IEnumerable<FileModel>>> GetProjectFiles(int pid)
        {
            var files = await _context.Files
                .Where(f => f.ProjectId == pid && !f.Palette)
                .Include(f => f.bTags)  // Include basic tags
                .Include(f => f.mTags)  // Include metadata tags
                .ToListAsync();
            
            return Ok(files);
        }
        
        // for thumbnail
        [HttpGet("files/{pid}/first-image")]
        public async Task<ActionResult<FileModel>> GetFirstProjectImage(int pid)
        {
            var firstImage = await _context.Files
                .Where(f => f.ProjectId == pid)
                .Include(f => f.bTags)
                .Include(f => f.mTags)
                .FirstOrDefaultAsync();
            
            return Ok(firstImage);
        }


        [HttpPost("{projectId}/archive")]        
        public async Task<IActionResult> ArchiveProject(int projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);

            if (project == null)
            {
                return NotFound("Project is not found");
            }

            var success = await _azureBlobService.SetProjectToArchiveAsync(projectId, _context);
            
            if (success)
            {
                project.isArchived = true;
                project.Status = "Inactive";
                await _context.SaveChangesAsync();

                return Ok("Archived successfully.");
            }
            else
            {
                return StatusCode(500, $"Failed to archive project {projectId}.");
            }
        }

        [HttpPost("{projectId}/unarchive")]        
        public async Task<IActionResult> UnarchiveProject(int projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);

            if (project == null)
            {
                return NotFound("Project is not found");
            }

            var success = await _azureBlobService.UnarchiveProjectAsync(projectId, _context);
            
            if (success)
            {
                project.isArchived = false;
                project.Status = "Active";
                await _context.SaveChangesAsync();

                return Ok("Archived successfully.");
            }
            else
            {
                return StatusCode(500, $"Failed to archive project {projectId}.");
            }
        }
        [HttpDelete("deleteFile/{projectId}/{fileId}")]
            public async Task<IActionResult> DeleteFileFromProject(int projectId, int fileId)
            {
                var fileTags = _context.FileTags.Where(ft => ft.FileId == fileId);
            
                // Remove the FileTag entries
                _context.FileTags.RemoveRange(fileTags);
                
                // Save changes to the database
                await _context.SaveChangesAsync();
                
                var file = await _context.Files.FirstOrDefaultAsync(f => f.Id == fileId && f.ProjectId == projectId);

                if (file == null)
                {
                    return NotFound("File not found in this project.");
                }
                await _azureBlobService.DeleteProjectFileAsync(file.OriginalPath);

                _context.Files.Remove(file);
                await _context.SaveChangesAsync();

                return Ok($"File with ID {fileId} deleted from project {projectId}.");
            }
    }
}
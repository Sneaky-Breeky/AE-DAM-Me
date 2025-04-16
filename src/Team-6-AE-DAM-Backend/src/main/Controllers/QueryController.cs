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
         public async Task<ActionResult<IEnumerable<ProjectModel>>> GetProjectQueryResult(string status,
             string location, DateTime startDate, DateTime endDate)
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


             if (projects == null || !projects.Any())
             {
                 return NotFound("No projects found matching the given criteria.");
             }

             return Ok(projects);
         }



         /*
          *
          * Functions for upload page
          * list of all basic tags in db (easy)
          * list of basic tags associated with a project (easy)
          * list of all metadata tags associated with a project (easy)
          *
          */

         // GET: api/query
         // list of all basic tags in db (easy)
         [HttpGet("basictags")]
         public async Task<ActionResult<IEnumerable<TagBasicModel>>> GetBasicTagsQuery()
         {
             var bTags = await _context.BasicTags.ToListAsync();
             if (bTags == null || !bTags.Any())
             {
                 return Ok("No tags found matching the given criteria.");
             }

             return Ok(bTags);
         }


         // GET: api/query/basictags/{pid}
         // list of all basic tags associated with a project (easy)
         // returns list of strings of basic tags
         [HttpGet("basictags/{pid}")]
         public async Task<ActionResult<IEnumerable<string>>> ProjectBasicTagsQuery(int pid)
         {
             var project = await _context.Projects.FindAsync(pid);
             if (project == null)
             {
                 return NotFound("Project not found.");
             }
             
             var bTags = await _context.FileTags
                 .Where(ft => _context.Files.Any(f => f.ProjectId == pid && f.Id == ft.FileId && !f.Palette))
                 .Select(ft => ft.TagId)
                 .Distinct()
                 .ToListAsync();

             // var bTags = await _context.BasicTags
             //     .Where(bt => _context.ProjectBasicTag
             //         .Where(pbt => pbt.ProjectId == pid)
             //         .Select(pbt => pbt.BasicTagValue)
             //         .Contains(bt.Value))    
             //     .Select(bt => bt.Value)
             //     .ToListAsync();

             if (bTags == null || !bTags.Any())
             {
                 return NotFound("No tags associated with this project.");
             }

             return Ok(bTags);
         }

         // GET: api/query/metadatags/{pid}
         // list of metadata tags associated with a project (easy)
         // returns list of strings of the keys for metadata tags
         [HttpGet("metadatatags/{pid}")]
         public async Task<ActionResult<IEnumerable<string>>> ProjectMetadataTagsQuery(int pid)
         {
             var project = await _context.Projects.FindAsync(pid);
             if (project == null)
             {
                 return NotFound("Project not found.");
             }

             var mTags = await _context.ProjectTags
                 .Where(mt => mt.ProjectId == pid )
                 .Select(mt => mt.Key)
                 .Distinct()
                 .ToListAsync();

             if (!mTags.Any())
             {
                 return Ok("No metadata tags associated with this project.");
             }

             return Ok(mTags);
         }
         [HttpGet("metadatatagsFile/{pid}")]
                  public async Task<ActionResult<IEnumerable<string>>> ProjectMetadataTagsFilesQuery(int pid)
                  {
                      var project = await _context.Projects.FindAsync(pid);
                      if (project == null)
                      {
                          return NotFound("Project not found.");
                      }

                      var mTags = await _context.MetadataTags
                          .Where(mt => _context.Files.Any(f => f.ProjectId == pid && f.Id == mt.FileId && !f.Palette))
                          .Select(mt => mt.Key)
                          .Distinct()
                          .ToListAsync();

                      if (!mTags.Any())
                      {
                          return Ok("No metadata tags associated with this project.");
                      }

                      return Ok(mTags);
                  }

         [HttpGet("metadatatagsValues/{pid}")]
                  public async Task<ActionResult<IEnumerable<string>>> ProjectMetadataTagsValuesQuery(int pid)
                  {
//                      var project = await _context.Projects.FindAsync(pid);
//                      if (project == null)
//                      {
//                          return NotFound("Project not found.");
//                      }

                      var mTags = await _context.ProjectTags
                          .Where(mt => mt.ProjectId == pid)
                          .Select(mt => new
                                     {
                                         mt.Key,
                                         mt.sValue,
                                         mt.iValue
                                     })
                          .ToListAsync();

                      if (!mTags.Any())
                      {
                          return Ok("No metadata tags associated with this project.");
                      }

                      return Ok(mTags);
                  }
         
         [HttpGet("metadataKeyUpload/{pid}")]
         public async Task<ActionResult<IEnumerable<string>>> ProjectMetadataKeysQuery(int pid)
         {
             var project = await _context.Projects.FindAsync(pid);
             if (project == null)
             {
                 return NotFound("Project not found.");
             }

             var mTags = await _context.MetadataTags
                 .Where(mt => _context.Files.Any(f => f.ProjectId == pid && f.Id == mt.FileId && !f.Palette))
                 .Select(mt => mt.Key)
                 .Distinct()
                 .ToListAsync();
             return Ok(mTags);
         }



         /*
          *
          * Functions for query project page
          * given a list of metadata tags, operators, and values, and project
            return the files that satisfy that criteria (hmm)
          * given a list of basic tags and project, return files with those basic
            tags (mid)
          * Function to combine the last 2 into one query
          *
          */



         // Helper for finding files with associated basictags
         private async Task<IQueryable<FileModel>> GetFilesBasicTagQuery(List<string> searchTags, ProjectModel project)
         {
             var files = _context.Files.Where(f => f.ProjectId == project.Id && !f.Palette);

             foreach (var tag in searchTags)
             {
                 // files = files.Where(f => _context.FileTags
                 //     .Any(ft => ft.TagId == tag && ft.FileId == f.Id));
                 files = files.Where(f => f.bTags.Any(bt => bt.Value == tag));
             }

             // files = files.DistinctBy(f => f.Id);
             return files;
         }

         // Assumes types are checked, should be checked in parent function
         // == will be treated separately
         private readonly
             Dictionary<string, Func<IQueryable<MetadataTagModel>, string, int, IQueryable<MetadataTagModel>>> _opMap
                 = new Dictionary<string, Func<IQueryable<MetadataTagModel>, string, int, IQueryable<MetadataTagModel>>>
                 {
                     {
                         "=", (query, key, value) =>
                             query.Where(t => t.Key == key && t.iValue == value)
                     },
                     {
                         "<", (query, key, value) =>
                             query.Where(t => t.Key == key && t.iValue < value)
                     },
                     {
                         ">", (query, key, value) =>
                             query.Where(t => t.Key == key && t.iValue > value)
                     },
                     {
                         "<=", (query, key, value) =>
                             query.Where(t => t.Key == key && t.iValue <= value)
                     },
                     {
                         ">=", (query, key, value) =>
                             query.Where(t => t.Key == key && t.iValue >= value)
                     }
                 };

         // Helper for finding files given a metadata query
         private IQueryable<MetadataTagModel> GetFilesMetadataTagQuery(string Key, string Op, string Value,
             IQueryable<MetadataTagModel> query, value_type type)
         {

             // Comparing string
             if (type == value_type.String)
             {
                 if (Op != "=")
                 {
                     throw new Exception("Invalid operation for type string.");
                 }

                 query = query.Where(mt => mt.Key == Key && mt.sValue == Value);
             }
             // Comparing integer
             else if (!_opMap.ContainsKey(Op))
             {
                 throw new Exception("Invalid operation");
             }
             else
             {
                 try
                 {
                     var parsedValue = Int32.Parse(Value);
                     query = _opMap[Op](query, Key, parsedValue);
                 }
                 catch (FormatException e)
                 {
                     throw new FormatException($"Unable to parse '{Value}'");
                 }
             }

             return query;
         }

         /*
          * Function to take a project, a list of strings (BasicTagList), and a list of <MetadataTagDTO
          * Return files filtered by the 2 lists
          *
          * POST: api/query/searchProject/{pid}
          *
          * Example Input
          * {
              "BasicTags": { "bTags": ["tag1", "tag2"] },
              "MetadataTags": [
                { "Key": "workers", "Op": ">", "Value": "10", "v_type": 1 },
                { "Key": "temperature", "Op": "<=", "Value": "30", "v_type": 1 }
              ]
            }

          *
          * Return: List of Files that match criteria
          *
          *
          */


         [HttpPost("searchProject/{pid}")]
         public async Task<ActionResult<IEnumerable<FileModel>>> GetFilesProjectQuery(
             [FromBody] ProjectFilesQuery request, int pid)
         {

             var project = await _context.Projects.FindAsync(pid);
             if (project == null)
             {
                 return NotFound("Project not found.");
             }

             // Query basictags first, then metadataTags

             // Basic tag filtering
             var bTags = request.BasicTags?.bTags;
             IQueryable<FileModel> files;

             if (bTags == null || !bTags.Any())
             {
                 files = _context.Files.Where(f => f.ProjectId == pid && !f.Palette);
             }
             else
             {
                 files = await GetFilesBasicTagQuery(bTags, project);
             }

             if (files == null || !files.Any())
             {
                 return BadRequest("No files match the criteria.");
             }
             
             // check to see if there are metadata tag fields
             if (request.MetadataTags == null || request.MetadataTags.Count == 0)
             {
                 var basicFiltered = await files.ToListAsync();
                 if (!basicFiltered.Any())
                     return BadRequest("No files match the criteria.");
        
                 return Ok(basicFiltered);
             }
             


             // Metadata tags associated with the project
             IQueryable<MetadataTagModel> mTags = _context.MetadataTags
                 .Where(mt => files.Any(f => f.ProjectId == pid && f.Id == mt.FileId));
             
             List<List<int>> conditionMatchedFileIds = new();

            // Query one tag at a time and then find files, then query again
             foreach (MetadataTagQueryDTO mTag in request.MetadataTags ?? new List<MetadataTagQueryDTO>())
             {
                 try
                 {
                     value_type v_type = (value_type)mTag.v_type;
                     var filteredQuery = GetFilesMetadataTagQuery(mTag.Key, mTag.Op, mTag.Value, mTags, v_type);
                     
                     var fileIds = await filteredQuery
                         .Select(mt => mt.FileId)
                         .Distinct()
                         .ToListAsync();
                     
                     conditionMatchedFileIds.Add(fileIds);

                 }
                 catch (Exception e)
                 {
                     return BadRequest(new { message = e.Message });
                 }

             }
             
             // Find files that matched
             var matchedFileIds = conditionMatchedFileIds
                 .Aggregate((prev, next) => prev.Intersect(next).ToList());

             if (!matchedFileIds.Any())
             {
                 return BadRequest("No files match the metadata criteria.");
             }

             var filteredFiles = await files.Where(f => matchedFileIds.Contains(f.Id)).ToListAsync();

             if (!filteredFiles.Any())
             {
                 return BadRequest("No files match the criteria.");
             }
             
             // var filteredFileIds = await mTags.Select(mt => mt.FileId).ToListAsync();
             //
             // if (filteredFileIds == null || !filteredFileIds.Any())
             // {
             //     return BadRequest("No files match the metadata criteria.");
             // }
             //
             // // Filter files by metadata tag matching file IDs
             // var filteredFiles = await files.Where(f => filteredFileIds.Contains(f.Id)).ToListAsync();

             if (filteredFiles == null || !filteredFiles.Any())
             {
                 return BadRequest("No files match the criteria.");
             }

             return Ok(filteredFiles);

         }

         

     }

     public class ProjectFilesQuery
     {
         public BasicTagList BasicTags { get; set; }

         public List<MetadataTagQueryDTO> MetadataTags { get; set; }
     }

     public class BasicTagList
     {
         public List<string> bTags {get; set;}
     }

     public class MetadataTagQueryDTO
     {
         public string Key { get; set; }
         public string Op { get; set; }
         public string Value { get; set; }
         public int v_type { get; set; }
     }

 }

     // public class ProjectQueryRequest
     // {
     //     public string Status { get; set; }
     //     public string? Location { get; set; }
     //     public DateTime StartDate { get; set; } = DateTime.MinValue;
     //     public DateTime EndDate { get; set; } = DateTime.MinValue;
     // }

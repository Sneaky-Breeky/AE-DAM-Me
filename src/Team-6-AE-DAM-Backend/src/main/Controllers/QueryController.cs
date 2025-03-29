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
     [Route("api/[controller]")]
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
             
             var bTags = await _context.BasicTags
                 .Where(bt => _context.ProjectBasicTag
                    .Where(pbt => pbt.ProjectId == pid)
                    .Select(pbt => pbt.BasicTagValue)
                    .Contains(bt.Value))
                 .Select(bt => bt.Value)
                 .ToListAsync();

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

             var mTags = await _context.MetadataTags
                 .Where(mt => _context.Files.Any(f => f.ProjectId == pid && f.Id == mt.FileId))
                 .Select(mt => mt.Key)
                 .Distinct()
                 .ToListAsync();
            
             if (!mTags.Any())
             {
                 return Ok("No metadata tags associated with this project.");
             }
             
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
         
         // api/query/project/{pid}
         // Example input format
         // given a list of basic tags and project, return files with those basic
         
         

         // Helper for finding files with associated basictags
         private async Task<IQueryable<FileModel>> GetFilesBasicTagQuery(List<string> searchTags, ProjectModel project)
         {
             var files = _context.Files.AsQueryable();
             
             foreach (var tag in searchTags)
             {
                 var filesToAdd = await _context.Files
                     .Where(f => _context.Set<Dictionary<string, object>>()
                         .Where(ft => ft["TagId"] == tag) 
                         .Select(ft => ft["FileId"])
                         .Contains(f.Id)) 
                     .ToListAsync();
                 
                 // Ensures no duplicates
                 files = files.Concat(filesToAdd.AsQueryable());
             }

             files = files.DistinctBy(f => f.Id);

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
         private IQueryable<MetadataTagModel> GetFilesMetadataTagQuery(string Key, string Op, string Value, IQueryable<MetadataTagModel> query, value_type type)
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
          * GET: api/query/searchProject/{pid}
          *
          * Example Input
          * {
              "basicTags": {
                "bTags": ["tag1", "tag2", "tag3"]
              },
              "metadataTags": [
                {
                  "Key": "workers",
                  "Op": ">",
                  "Value": "10",
                  "v_type": 1
                },
                {
                  "Key": "temperature",
                  "Op": "<=",
                  "Value": "30",
                  "v_type": 1
                },
                {
                  "Key": "status",
                  "Op": "==",
                  "Value": "active,
                  "v_type": 0
                }
              ]
            }
          *
          * Return: List of Files that match criteria
          *
          * 
          */

         [HttpGet("searchProject/{pid}")]
         public async Task<ActionResult<IEnumerable<FileModel>>> GetFilesProjectQuery([FromBody] BasicTagList basicTags,
             [FromBody] List<MetadataTagQueryDTO> metadataTags, int pid)
         {
             
             var project = await _context.Projects.FindAsync(pid);
             if (project == null)
             {
                 return NotFound("Project not found.");
             }
             
             // Query basictags first, then metadataTags

             var bTags = basicTags.bTags;
             IQueryable<FileModel> files;
             
             if (bTags == null || !bTags.Any())
             {
                 files  = _context.Files.Where(f => f.ProjectId == pid);
             }
             else
             {
                 files = await GetFilesBasicTagQuery(bTags, project);
             }

             if (files == null || !files.Any())
             {
                 return BadRequest("No files match the criteria.");
             }
             
             
             // Metadata tags associated with the project
             IQueryable<MetadataTagModel> mTags = _context.MetadataTags
                 .Where(mt => files.Any(f => f.ProjectId == pid && f.Id == mt.FileId));
             
             
             foreach (MetadataTagQueryDTO mTag in metadataTags)
             {
                 try
                 {
                     value_type v_type = (value_type)mTag.v_type;
                     mTags = GetFilesMetadataTagQuery(mTag.Key, mTag.Op, mTag.Value, mTags, v_type);
                     
                 }
                 catch (Exception e)
                 {
                     return BadRequest(new { message = e.Message });
                 }
                 
             }
             
             var filteredFileIds = await mTags.Select(mt => mt.FileId).ToListAsync();

             if (filteredFileIds == null || !filteredFileIds.Any())
             {
                 return BadRequest("No files match the metadata criteria.");
             }

             // Filter files by metadata tag matching file IDs
             var filteredFiles = await files.Where(f => filteredFileIds.Contains(f.Id)).ToListAsync();

             if (filteredFiles == null || !filteredFiles.Any())
             {
                 return BadRequest("No files match the criteria.");
             }

             return Ok(filteredFiles);
             

         }
         
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



     public class ProjectQueryRequest
     {
         public string Status { get; set; }
         public string? Location { get; set; }
         public DateTime StartDate { get; set; } = DateTime.MinValue;
         public DateTime EndDate { get; set; } = DateTime.MinValue;
     }
 }


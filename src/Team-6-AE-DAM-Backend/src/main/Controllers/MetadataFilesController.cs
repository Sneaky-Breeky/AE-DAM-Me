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

namespace DAMBackend.Controllers
{
    // api/MetadataFiles
    [Route("api/metaData")]
    [ApiController]
    public class MetadataFilesController : ControllerBase
    {
        private readonly SQLDbContext _context;
        public MetadataFilesController(SQLDbContext context)
        {
            _context = context;
        }
        
        // POST: api/MetadataFiles/Advanced/{fid}
        /* Input format should be:
            {
              "Key": "TagName",
              "Value": "Hello" or "3902" // Depends on type
              "Type": 0 // for String or 1 for "Integer", depending on the value type
            }
        */  
        [HttpPost("advanced/{fid}")]
        public async Task<IActionResult> AddFileMetaTag(
            int fid,
            [FromBody] MetadataTagDTO request)
        {

            var engine = new SQLEntryEngine(_context);

            var file = await _context.Files.FindAsync(fid);

            if (file == null)
            {
                return NotFound();
            }

            try
            {
                var tag = await engine.addMetadataFileTag(
                    file,
                    request.Key,
                    request.Value,
                    request.Type
                );
                return Ok($"MetadataTag with key '{tag.Key}' and value '{request.Value}' added to File '{fid}'");
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
        
        // POST: Basic/{fid}/{value}
        // Add a tag to a project, if it doesnt exist create it
        [HttpPost("basic/{fid}/{value}")]
        public async Task<IActionResult> AddFileBasicTag(int fid, string value)
        {
            var tag = await _context.BasicTags.FindAsync(value);
            var file = await _context.Files.FindAsync(fid);

            if (file == null)
            {
                return NotFound("File not found");
            }

            if (tag == null)
            {
                tag = new TagBasicModel
                {
                    Value = value
                };
                _context.BasicTags.Add(tag);
            }
            
            tag.Files.Add(file);
            file.bTags.Add(tag);
            await _context.SaveChangesAsync();

            return Ok($"Tag '{value}' added to File '{fid}'");
        }
        
        // DELETE: Basic/{fid}/{value}
        
        // Remove a basic tag from a file
        [HttpDelete("Basic/{fid}/{value}")]
        public async Task<IActionResult> RemoveFileBasicTag(int fid, string value)
        {
            var file = await _context.Files.FindAsync(fid);
            if (file == null)
            {
                return NotFound("File not found");
            }

            var tag = await _context.BasicTags.FindAsync(value);
            if (tag == null)
            {
                return NotFound("Tag not found");
            }

            if (file.bTags.Contains(tag))
            {
                // return BadRequest("Tag is not associated with this file.");
            }

            file.bTags.Remove(tag);
            tag.Files.Remove(file);

            // Remove tag from database if it's no longer with a file?
            // if (!tag.Files.Any() && )
            // {
            //     _context.BasicTags.Remove(tag);
            // }
            var joinEntry = await _context.FileTags
                .FirstOrDefaultAsync(ft => ft.FileId == fid && ft.TagId == value);

            if (joinEntry == null)
                return BadRequest("Tag is not associated with this file.");

            _context.FileTags.Remove(joinEntry);
            await _context.SaveChangesAsync();

            return Ok($"Tag '{value}' removed from file {fid}");
        }


        [HttpDelete("Advanced/{fid}/{key}")]
        public async Task<IActionResult> RemoveFileMetaTag(int fid, string key)
        {
            try
            {
                var file = await _context.Files.FindAsync(fid);
                if (file == null)
                {
                    return NotFound("File not found");
                }

                var tag = await _context.MetadataTags
                    .FirstOrDefaultAsync(t => t.FileId == fid && t.Key == key);

                if (tag == null)
                {
                    return NotFound("Metadata tag not found");
                }

                _context.MetadataTags.Remove(tag);
                await _context.SaveChangesAsync();

                return Ok($"Metadata tag '{key}' removed from file {fid}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while removing the metadata tag: {ex.Message}");
            }
        }
        
        // PUT /projectSuggestion/{pid}
        [HttpPut("projectSuggestion/{pid}/{fid}")]
        public async Task<IActionResult> AssignProjectForSuggestion(int pid, int fid)
        {
            var file = await _context.Files.FindAsync(fid);
            if (file == null)
            {
                return NotFound("File not found");
            }

            var project = await _context.Projects.FindAsync(pid);

            if (project == null)
            {
                return NotFound("Project not found");
            }
            
            file.ProjectId = pid;
            await _context.SaveChangesAsync();
            
            return Ok("Suggestion assigned");
            
        }

        // PUT: Advanced/{fid}/{key}/{newValue}
        // Edit a metadata tag's value or type
        /*
         * 
         */
        [HttpPut("Advanced/{fid}/{key}/{newValue}")]
        public async Task<IActionResult> EditFileMetaTag(
            int fid,
            string key,
            string newValue)
        {
            var file = await _context.Files.FindAsync(fid);
            if (file == null)
            {
                return NotFound("File not found");
            }

            var tag = await _context.MetadataTags
                .FirstOrDefaultAsync(t => t.FileId == fid && t.Key == key);

            if (tag == null)
            {
                return NotFound("Metadata tag not found");
            }

            var engine = new SQLEntryEngine(_context);

            try
            {
                await engine.editMetadata(file, tag, newValue);
                return Ok($"Metadata tag '{key}' updated for file {fid}");
            }
            catch (FormatException e)
            {
                return BadRequest(new { message = e.Message });
            }
            
        }

    }

}
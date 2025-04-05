using Microsoft.Identity.Client;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;


namespace DAMBackend.Models

/*
    ***INSTRUCTIONS FOR USE***

String key, which will appear on the front end
Type of argument, currently String or Integer
Value that follows the type given
Project and Projectid assigned to know which file is referenced

*/
{
    public class ProjectTagModel
        // Metadata
    {
        [Required]
        public int ProjectId { get; set; }
        
        [JsonIgnore]
        public ProjectModel? Project { get; set; }
        
        
        [Required]
        public string Key { get; set; }

        public string? sValue {get; set;}

        public int? iValue {get; set;}

        [Required]
        public value_type type {get; set;}
    }
}
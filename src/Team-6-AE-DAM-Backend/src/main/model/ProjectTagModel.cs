using Microsoft.Identity.Client;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
        public required int ProjectId { get; set; }
        
        public required string Key { get; set; }

        public required ProjectModel Project { get; set; }

        public string sValue {get; set;}

        public int iValue {get; set;}

        public required value_type type {get; set;}

    }
}
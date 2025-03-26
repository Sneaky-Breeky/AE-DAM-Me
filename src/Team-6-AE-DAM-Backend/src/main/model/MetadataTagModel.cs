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
File and Fileid assigned to know which file is referenced

*/
{

    public enum value_type {
        String,
        Integer
    }

    public class MetadataTagModel

    // Metadata

    {
        public int FileId { get; set; }
        
        public required string Key { get; set; }

        public FileModel File { get; set; }

        public string sValue { get; set; }

        public int iValue {get; set;}

        public required value_type type {get; set;}

        

    }
}
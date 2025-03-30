// *** Not using Data Annotations currently as am not sure how the searching 
// will work, fluent API is supposedly better, will ask team
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Text.Json.Serialization;

namespace DAMBackend.Models

/* 
    ***INSTRUCTIONS FOR USE***

EXIF parsed data to fill out fields
A list of both metadata and regular tags
User that added the file with their id
Project that it was added to with id

*/
{
    // some of the data might not be found on exif, so i changed some collumn to be nullable
    public class FileModel 
    {
        // [Key]
        // [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        //
        // public int NewId { get; set; }
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string Extension { get; set; }
        public string? Description { get; set; }
        public required string ThumbnailPath { get; set; }
        public required string ViewPath { get; set; }
        public required string OriginalPath { get; set; }
        public string? Location { get; set; }
        

        public ImageResolution Resolution { get; set; }


        public decimal? GPSLat { get; set; }
        public decimal? GPSLon { get; set; }
        public decimal? GPSAlt { get; set; }
        
        public DateTime? DateTimeOriginal { get; set; }
        public required int PixelWidth { get; set; }
        public required int PixelHeight { get; set; }
        public string? Make { get; set; }
        public string? Model { get; set; }
        public int? FocalLength { get; set; }
        public float? Aperture { get; set; }
        public string? Copyright { get; set; }

        public ICollection<MetadataTagModel> mTags { get; set; } = new HashSet<MetadataTagModel>();
        public ICollection<TagBasicModel> bTags { get; set;} = new HashSet<TagBasicModel>();
        
        public ICollection<LogImage> Logs { get; set;} = new HashSet<LogImage>();

        public int? ProjectId { get; set; }
        [JsonIgnore]
        public ProjectModel? Project { get; set; }

        public int UserId { get; set; }
        
        // change to be required )
        [JsonIgnore]
        public UserModel User { get; set; }

        public bool Palette {get; set;}
    }
    public class FileTag
    {
        public int FileId { get; set; }
        public string TagId { get; set; }

        public FileModel File { get; set; }
        public TagBasicModel Tag { get; set; }
    }
}
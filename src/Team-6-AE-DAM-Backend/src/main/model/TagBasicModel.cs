using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace DAMBackend.Models
/* 
    ***INSTRUCTIONS FOR USE***

Basic tag (e.g. Construction, Bridge) must be a string
File and fileid that it is attached too

*/

{
    public class TagBasicModel {
        // [Key]
        // [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        // public int Id { get; set; }
        public required string Value { get; set; }
        [JsonIgnore]
        public ICollection<ProjectModel> Projects { get; set; } = new HashSet<ProjectModel>();
        [JsonIgnore]
        public ICollection<FileModel> Files { get; set; } = new HashSet<FileModel>();
    }
}


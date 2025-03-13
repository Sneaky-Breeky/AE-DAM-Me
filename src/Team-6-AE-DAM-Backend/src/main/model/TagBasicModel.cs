using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace DAMBackend.Models
/* 
    ***INSTRUCTIONS FOR USE***

Basic tag (e.g. Construction, Bridge) must be a string
File and fileid that it is attached too

*/

{
    [Keyless]
    public class TagBasicModel {
        // [Key]
        // [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        // public int Id { get; set; }

        public required Guid FileId { get; set; }

        public required FileModel File { get; set; }

        public required string Value { get; set; }
    }
}


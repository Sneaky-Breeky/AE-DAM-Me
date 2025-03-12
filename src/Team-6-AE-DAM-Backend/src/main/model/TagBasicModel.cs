namespace DAMBackend.Models
/* 
    ***INSTRUCTIONS FOR USE***

Basic tag (e.g. Construction, Bridge) must be a string
File and fileid that it is attached too

*/

{
    public class TagBasicModel {
        public required Guid FileId { get; set; }

        public required FileModel File { get; set; }

        public required string Value { get; set; }
    }
}


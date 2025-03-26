// using System;
// using System.ComponentModel.DataAnnotations;

// namespace DAMBackend.Models

// {
//     public enum Department {
//             Elec,
//             Mech,
//             Civil,
//             Software,
//             Environment,
//             Management,
//             Other
//         }
//     public enum MediaType {
//         Photo,
//         Video,
//         Drawing,
//         Document,
//         Other
//     }



//     public class TagModel

//     // Metadata

//     {
//         [Key]
//         public int Id { get; set; }

//         public required int UserId { get; set; }

//         public Guid? ProjectId { get; set; }

//         public required string Phase { get; set; }
//         // Ask developers
        
//         public Department Dep { get; set; }

//         public MediaType Type { get; set; }

//         // public required Guid FileId { get; set; }

//         public List<FileModel> Files { get; set; } = new List<FileModel>();
//     }
// }
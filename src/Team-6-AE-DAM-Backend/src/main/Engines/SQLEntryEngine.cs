using DAMBackend.Models;

using DAMBackend.Data;

using Microsoft.EntityFrameworkCore;

namespace DAMBackend.services

/*

ON DELETE CASCADE where appropriate s
*/

{
    public class SQLEntryEngine
    {

        // Connecting to database
        private readonly SQLDbContext _context;

        // parameter will be AppDbContext db
        public SQLEntryEngine(SQLDbContext db)
        {
            _context = db;
        }

        // change to async task when uploading to database
        public UserModel AddUser(string first, string last, string email, Role role, bool stat)
        {
            var user = new UserModel
            {
                FirstName = first,
                LastName = last,
                Email = email,
                Role = role,
                Status = stat
            };

            // database.Users.Add(user); 
            // await database.SaveChanges();
            // add when database implemented

            return user;
        }

        // take result from extractExifData
        // palette has to be set on creation

        // Called from submission engine after exif data has been extracted
        // 
        public FileModel AddFile(FileModel file, UserModel user, ProjectModel project)
        {
            if (project != null)
            {
                file.Project = project;
                file.ProjectId = project.Id;
            }
            else
            {
                throw new Exception("No Project was specified");
            }

            if (user != null)
            {
                file.User = user;
                file.UserId = user.Id;
            }
            else
            {
                throw new Exception("No User was specified");
            }


            // database.Files.Add(file);
            // await database.SaveChanges();
            return file;
        }

        // public MetadataTagModel addTags(FileModel file, string key, object value, value_type v_type)
        // {
        //     // if (!IsValidValue(value, v_type))
        //     // {
        //     //     throw new ArgumentException(
        //     //         $"Invalid value type for key {key}. Expected {v_type}, but got {value.GetType().Name}.");
        //     // }
        //
        //     var tag = new MetadataTagModel
        //     {
        //         Key = key,
        //         type = v_type,
        //         FileId = file.Id,
        //         File = file
        //     };
        //
        //     if (v_type == value_type.String)
        //     {
        //         tag.sValue = value as string;
        //     }
        //     else
        //     {
        //         tag.iValue = Convert.ToInt32(value);
        //     }
        //
        //     if (file != null)
        //     {
        //         tag.FileId = file.Id;
        //         file.mTags.Add(tag);
        //     }
        //     else
        //     {
        //         throw new Exception("File was not added to tag, please attach a File");
        //     }
        //
        //     // database.Tags.Add(tag);
        //     // await database.SaveChanges();
        //     return tag;
        // }

        public TagBasicModel addTags(FileModel file, string value)
        {

            var tag = new TagBasicModel
            {
                Value = value
            };

            if (file != null)
            {
                tag.Files.Add(file);
                file.bTags.Add(tag);
            }
            else
            {
                throw new Exception("File was not added to tag, please attach a File");
            }

            // database.Tags.Add(tag);
            // await database.SaveChanges();
            return tag;
        }

        public async Task<ProjectModel> addProject(string name, string status, string location, string imagePath,
            string phase, AccessLevel al, DateTime lastUp, string desription, DateTime startDate)
        {
            var project = new ProjectModel
            {
                Name = name,
                Status = status,
                Location = location,
                ImagePath = imagePath,
                AccessLevel = al,
                LastUpdate = lastUp,
                Phase = phase,
                Description = desription,
                StartDate = startDate
            };
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
            return project;
        }

        // Prereq: ProjectId references a valid Project
        public async Task<ProjectTagModel> addProjectTag(ProjectModel Project, string Key, string Value, value_type v_type)
        {
            
            
            var tag = new ProjectTagModel 
            {   
                Project = Project,
                Key = Key,
                type = v_type,
                ProjectId = Project.Id
            };

            if (v_type == value_type.String)
            {
                tag.sValue = Value;
            } else
            {
                try
                {
                    tag.iValue = Int32.Parse(Value);
                }
                catch (FormatException)
                {
                    Console.WriteLine($"Unable to parse '{Value}'");
                }
            }
            
            Project.Tags.Add(tag);
            _context.ProjectTags.Add(tag);

            await _context.SaveChangesAsync();

            return tag;

        }
    }
}
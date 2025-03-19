using DAMBackend.Models;

using DAMBackend.Data;

using Microsoft.EntityFrameworkCore;


/*

ON DELETE CASCADE where appropriate s
*/

namespace DAMBackend.services
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

        public MetadataTagModel addTags(FileModel file, string key, object value, value_type v_type)
        {
            if (!IsValidValue(value, v_type))
            {
                throw new ArgumentException(
                    $"Invalid value type for key {key}. Expected {v_type}, but got {value.GetType().Name}.");
            }

            var tag = new MetadataTagModel
            {
                Key = key,
                type = v_type,
                FileId = file.Id,
                File = file
            };

            if (v_type == value_type.String)
            {
                tag.sValue = value as string;
            }
            else
            {
                tag.iValue = Convert.ToInt32(value);
            }

            if (file != null)
            {
                tag.FileId = file.Id;
                file.mTags.Add(tag);
            }
            else
            {
                throw new Exception("File was not added to tag, please attach a File");
            }

            // database.Tags.Add(tag);
            // await database.SaveChanges();
            return tag;
        }

        private bool IsValidValue(object value, value_type expectedType)
        {
            return expectedType switch
            {
                value_type.String => value is string, // Check if value is a string
                value_type.Integer => value is int, // Check if value is an integer
                _ => false // If the type doesn't match, return false
            };
        }

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
            string phase, AccessLevel al, DateTime lastUp, string desription)
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
                Description = desription
            };
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
            return project;
        }

        // Prereq: ProjectId references a valid Project
        public async Task<ProjectTagModel> addProjectTag(ProjectModel Project, string Key, object Value, value_type v_type)
        {
            
            if (!IsValidValue(Value, v_type)) {
                throw new ArgumentException($"Invalid value type for key {Key}. Expected {v_type}, but got {Value.GetType().Name}.");
            }
            
            var tag = new ProjectTagModel 
            {   
                Key = Key,
                type = v_type,
                ProjectId = Project.Id,
                Project = Project
            };

            if (v_type == value_type.String) {
                tag.sValue = Value as string;
            } else
            {
                tag.iValue = Convert.ToInt32(Value);
            }
            
            Project.Tags.Add(tag);
            _context.ProjectTags.Add(tag);

            await _context.SaveChangesAsync();

            return tag;

        }
    }
}
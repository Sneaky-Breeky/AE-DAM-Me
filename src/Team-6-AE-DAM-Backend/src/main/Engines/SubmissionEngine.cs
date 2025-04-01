using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;
using Xabe.FFmpeg;
using SixLabors.ImageSharp.Metadata;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;
using DAMBackend.Models;
using ImageMagick;
using System.Diagnostics;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using File = System.IO.File;
using ImageSharpExif = SixLabors.ImageSharp.Metadata.Profiles.Exif;
using ImageSharpExifTag = SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag;




namespace DAMBackend.SubmissionEngine
{
    public enum CompressionLevel // used for Compress method
    {
        Low,
        Medium,
        High // High means original resolution
    }
    public class SubmissionEngine
    {

        private readonly string _uploadPath = "../../../TestOutput"; //hard coded value

        public SubmissionEngine()
        {
        }
      
        // upload multiple files to pallete, no compression performed
        // make use the user has access to the palette
        // extracts EXIF metadata for each file and put 
        public async Task<List<string>> UploadFiles(List<IFormFile> files) // string useremail
        {
            // check if the user has access to the palette
            
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
                Console.WriteLine($"Directory created: {_uploadPath}");
            }
            else
            {
                Console.WriteLine($"Directory already exists: {_uploadPath}");
            }

            if (files.Count > 100)
            {
                throw new Exception("You can upload a maximum of 100 files at once.");
            }
            Console.WriteLine("The length of files is: " + files.Count);

            List<string> uploadedFileNames = new List<string>();

            foreach (var file in files)
            {
                var allowedExtensionsPhoto = new[] { ".jpg", ".jpeg", ".png", ".raw", ".arw" };
                var allowedExtensionsVideo = new[] { ".mp4" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (!allowedExtensionsPhoto.Contains(fileExtension) && !allowedExtensionsVideo.Contains(fileExtension))
                {
                    throw new Exception($"File {file.FileName} has an unsupported file type.");
                }

                if (file.Length > 500 * 1024 * 1024) // 500MB
                {
                    throw new Exception($"File {file.FileName} exceeds the maximum allowed size.");
                }

                var filePath = Path.Combine(_uploadPath, file.FileName);

                using (var stream = System.IO.File.Create(filePath))
                {
                    await file.CopyToAsync(stream);
                }
                uploadedFileNames.Add(file.FileName);
            }

            if (uploadedFileNames.Count == 0)
            {
                throw new Exception("No valid files were uploaded.");
            }


            // perform the query to the database for 

            return uploadedFileNames;
        }

        // compress jpg and png image based on the compression option
        public async Task<IFormFile> UploadJpgPng(IFormFile file, CompressionLevel option)
        {
        
            // Compression settings
            int quality;
            int maxWidth;
            int maxHeight;
            switch (option)
            {
                case CompressionLevel.Low:
                    quality = 30;
                    maxWidth = 800;
                    maxHeight = 600;
                    break;
                case CompressionLevel.Medium:
                    quality = 60;
                    maxWidth = 1600;
                    maxHeight = 1200;
                    break;
                case CompressionLevel.High:
                    quality = 100;
                    maxWidth = int.MaxValue;
                    maxHeight = int.MaxValue;
                    break;
                default:
                    throw new Exception("Invalid compression level.");
            }
        
            // Use a memory stream to hold the compressed image
            var outputStream = new MemoryStream();
        
            using (var inputStream = file.OpenReadStream())
            using (var image = await Image.LoadAsync(inputStream))
            {
                // Resize if not high quality
                if (option != CompressionLevel.High)
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Max,
                        Size = new Size(maxWidth, maxHeight)
                    }));
                }
        
                // Save as JPEG
                await image.SaveAsync(outputStream, new JpegEncoder { Quality = quality });
            }
        
            // Reset stream position so it's readable
            outputStream.Position = 0;
        
            // Create a new IFormFile from memory stream
            var compressedFile = new FormFile(outputStream, 0, outputStream.Length, file.Name, file.FileName)
            {
                Headers = file.Headers,
                ContentType = "image/jpeg"
            };
        
            return compressedFile;
        }

       	public async Task<IFormFile> UploadRaw(IFormFile file, CompressionLevel option)
        {
            if (file == null || file.Length == 0)
            {
                throw new Exception("Invalid file.");
            }
        
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensionsRaw = new[] { ".arw", ".cr2", ".nef", ".dng" };
            
            if (!allowedExtensionsRaw.Contains(fileExtension))
            {
                throw new Exception("Unsupported RAW file format.");
            }
            
            if (option == CompressionLevel.High)
            {
                // Return original RAW file as-is
                var rawStream = new MemoryStream();
                await file.CopyToAsync(rawStream);
                rawStream.Position = 0;

                return new FormFile(rawStream, 0, rawStream.Length, file.Name, file.FileName)
                {
                    Headers = file.Headers,
                    ContentType = file.ContentType
                };
            }
        
            // Proceed with compression logic for Medium/Low
            uint quality = option == CompressionLevel.Medium ? 60u : 20u;

            try
            {
                using (var stream = file.OpenReadStream())
                {
                    var settings = new MagickReadSettings
                    {
                        Density = new Density(300)
                    };

                    settings.Format = fileExtension switch
                    {
                        ".cr2" => MagickFormat.Cr2,
                        ".nef" => MagickFormat.Nef,
                        ".arw" => MagickFormat.Arw,
                        ".dng" => MagickFormat.Dng,
                        _ => settings.Format
                    };

                    using (var image = new MagickImage(stream, settings))
                    {
                        image.AutoOrient();
                        image.Format = MagickFormat.Jpeg;
                        image.Quality = quality;

                        var outputStream = new MemoryStream();
                        await image.WriteAsync(outputStream);
                        outputStream.Position = 0;

                        var newFileName = Path.ChangeExtension(file.FileName, ".jpg");

                        return new FormFile(outputStream, 0, outputStream.Length, file.Name, newFileName)
                        {
                            Headers = file.Headers,
                            ContentType = "image/jpeg"
                        };
                    }
                }
            }
            catch (MagickCoderErrorException ex)
            {
                throw new Exception($"Failed to process RAW file: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                throw new Exception($"Unexpected error during RAW file processing: {ex.Message}", ex);
            }
        }


        public async Task<IFormFile> UploadMp4(IFormFile file, CompressionLevel option)
        {
            if (file == null || file.Length == 0)
                throw new Exception("Invalid file.");
        
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (fileExtension != ".mp4")
                throw new Exception("Only MP4 files are supported.");
        
            if (option == CompressionLevel.High)
            {
                // Return original file as-is
                var rawStream = new MemoryStream();
                await file.CopyToAsync(rawStream);
                rawStream.Position = 0;
        
                return new FormFile(rawStream, 0, rawStream.Length, file.Name, file.FileName)
                {
                    Headers = file.Headers,
                    ContentType = file.ContentType
                };
            }
        
            // Save the uploaded file to a temp location
            var tempInputPath = Path.GetTempFileName() + ".mp4";
            var tempOutputPath = Path.GetTempFileName() + "_compressed.mp4";
        
            await using (var stream = new FileStream(tempInputPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
        
            // Define compression args
            string compressionArgs = option switch
            {
                CompressionLevel.Low => "-crf 32",
                CompressionLevel.Medium => "-crf 28",
                _ => throw new Exception("Invalid compression level.") // Already handled High
            };
        
            string ffmpegArgs = $"-i \"{tempInputPath}\" -c:v libx264 -pix_fmt yuv420p {compressionArgs} -threads 4 -preset superfast \"{tempOutputPath}\"";
        
            var processInfo = new ProcessStartInfo
            {
                FileName = "ffmpeg",
                Arguments = ffmpegArgs,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
        
            using (var process = new Process { StartInfo = processInfo })
            {
                process.Start();
                string output = await process.StandardError.ReadToEndAsync(); // Capture FFmpeg logs
                await process.WaitForExitAsync();
        
                if (process.ExitCode != 0)
                {
                    throw new Exception($"FFmpeg failed: {output}");
                }
            }
        
            // Load compressed video into memory stream
            var memoryStream = new MemoryStream(await File.ReadAllBytesAsync(tempOutputPath));
            memoryStream.Position = 0;
        
            // Clean up temp files
            File.Delete(tempInputPath);
            File.Delete(tempOutputPath);
        
            // Return compressed video as IFormFile
            var newFileName = Path.ChangeExtension(file.FileName, ".mp4");
            return new FormFile(memoryStream, 0, memoryStream.Length, file.Name, newFileName)
            {
                Headers = file.Headers,
                ContentType = "video/mp4"
            };
        }
		public async Task<IFormFile> GenerateThumbnail(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                throw new Exception("Invalid file.");
            }
        
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        
            // Check the file extension and call the appropriate method based on the type
            if (new[] { ".arw", ".cr2", ".nef", ".dng" }.Contains(fileExtension))
            {
                // Call the GenerateThumbnailRaw for RAW files
                return await GenerateThumbnailRaw(file);
            }
			else if (new[] { ".mp4" }.Contains(fileExtension))
            {
                // Call the GenerateThumbnailJpgPng for JPG/PNG files
                return await GenerateMp4ThumbnailAsync(file);
            }
            else if (new[] { ".jpg", ".jpeg", ".png" }.Contains(fileExtension))
            {
                // Call the GenerateThumbnailJpgPng for JPG/PNG files
                return await GenerateThumbnailJpgPng(file);
            }
            else
            {
                throw new Exception("Unsupported file format for thumbnail generation.");
            }
        }
        
       public async Task<IFormFile> GenerateMp4ThumbnailAsync(IFormFile videoFile)
{
    string tempDir = Path.Combine(Directory.GetCurrentDirectory(), "TestOutput", "Temp");
    Directory.CreateDirectory(tempDir);

    string tempVideoPath = Path.Combine(tempDir, $"input_{Guid.NewGuid()}.mp4");
    string tempThumbnailPath = Path.Combine(tempDir, $"thumb_{Guid.NewGuid()}.jpg");

    try
    {
        // Save uploaded video
        await using (var fs = new FileStream(tempVideoPath, FileMode.Create))
            await videoFile.CopyToAsync(fs);

        // FFmpeg arguments to generate a thumbnail (no orientation adjustments)
        string ffmpegArgs = $"-ss 00:00:00 -i \"{tempVideoPath}\" -vframes 1 -q:v 3 \"{tempThumbnailPath}\"";
		//string ffmpegArgs = $"-ss 00:00:10 -i \"{tempVideoPath}\" -vf \"thumbnail,scale=iw:ih\" -vframes 1 -q:v 3 \"{tempThumbnailPath}\"";

		


        var startInfo = new ProcessStartInfo("ffmpeg", ffmpegArgs)
        {
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        string ffmpegError = "";
        string ffmpegOutput = "";

        using (var process = Process.Start(startInfo))
        {
            ffmpegError = await process.StandardError.ReadToEndAsync();
            ffmpegOutput = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0 || !File.Exists(tempThumbnailPath))
            {
                throw new Exception($"FFmpeg failed. Exit Code: {process.ExitCode}\n" +
                    $"Output: {ffmpegOutput}\n" +
                    $"Error: {ffmpegError}");
            }
        }

        // Return thumbnail as IFormFile
        var memory = new MemoryStream(await File.ReadAllBytesAsync(tempThumbnailPath));
        string fileName = $"{Path.GetFileNameWithoutExtension(videoFile.FileName)}_thumbnail.jpg";

        return new FormFile(memory, 0, memory.Length, "thumbnail", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/jpeg"
        };
    }
    catch (Exception ex)
    {
        // Log the full exception details
        Console.WriteLine($"Thumbnail Generation Error: {ex}");
        throw; // Re-throw to maintain original error handling
    }
    finally
    {
        SafeDeleteFile(tempVideoPath);
        SafeDeleteFile(tempThumbnailPath);
    }
}
        
        private void SafeDeleteFile(string path)
        {
            try { if (File.Exists(path)) File.Delete(path); } catch { }
        }

		public async Task<IFormFile> GenerateThumbnailRaw(IFormFile file)
        {
            try
            {
                using (var stream = file.OpenReadStream())
                {
                    var settings = new MagickReadSettings
                    {
                        Density = new Density(300)
                    };
        			var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

                    settings.Format = fileExtension switch
                    {
                        ".cr2" => MagickFormat.Cr2,
                        ".nef" => MagickFormat.Nef,
                        ".arw" => MagickFormat.Arw,
                        ".dng" => MagickFormat.Dng,
                        _ => settings.Format
                    };
        
                    using (var image = new MagickImage(stream, settings))
                    {
                        image.AutoOrient();
        
                        // Create a low-quality thumbnail by resizing the image to a smaller size
                        image.Resize(400, 400); // Resize to 200x200 pixels (adjust size as needed)
                        image.Format = MagickFormat.Jpeg;
                        image.Quality = 30; // Low quality for thumbnail (adjust as needed)
        
                        var outputStream = new MemoryStream();
                        await image.WriteAsync(outputStream);
                        outputStream.Position = 0;
        
                        var newFileName = Path.ChangeExtension(file.FileName, ".jpg");
        
                        return new FormFile(outputStream, 0, outputStream.Length, file.Name, newFileName)
                        {
                            Headers = file.Headers,
                            ContentType = "image/jpeg"
                        };
                    }
                }
            }
            catch (MagickCoderErrorException ex)
            {
                throw new Exception($"Failed to process RAW file: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                throw new Exception($"Unexpected error during RAW file processing: {ex.Message}", ex);
            }
        }

		public async Task<IFormFile> GenerateThumbnailJpgPng(IFormFile file)
        {
            try
            {
                // Thumbnail settings
                int thumbnailWidth = 300;  // Set the thumbnail width
                int thumbnailHeight = 300; // Set the thumbnail height
                int quality = 30;          // Set the quality of the thumbnail (lower quality for smaller size)
        
                var outputStream = new MemoryStream();
        
                using (var inputStream = file.OpenReadStream())
                using (var image = await Image.LoadAsync(inputStream))
                {
                    // Resize to generate a thumbnail
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Max,
                        Size = new Size(thumbnailWidth, thumbnailHeight)
                    }));
        
                    // Save the thumbnail as JPEG to reduce file size
                    await image.SaveAsync(outputStream, new JpegEncoder { Quality = quality });
                }
        
                // Reset stream position so it's readable
                outputStream.Position = 0;
        
                // Create a new IFormFile from the memory stream
                var thumbnailFile = new FormFile(outputStream, 0, outputStream.Length, file.Name, file.FileName)
                {
                    Headers = file.Headers,
                    ContentType = "image/jpeg"
                };
        
                return thumbnailFile;
            }
            catch (Exception ex)
            {
                throw new Exception($"Unexpected error while creating thumbnail: {ex.Message}", ex);
            }
        }
        
        public FileModel ProcessImageMetadataJpgPng(IFormFile imageFile, string basePath, UserModel currentUser)
		{
            // Validate input
            if (imageFile == null || imageFile.Length == 0)
            {
                throw new ArgumentException("Invalid image file");
            }
        
            // Generate unique file paths
            string originalPath = Path.Combine(basePath, "originals", imageFile.FileName);
            string viewPath = Path.Combine(basePath, "views", imageFile.FileName);
            string thumbnailPath = Path.Combine(basePath, "thumbnails", imageFile.FileName);
        
            // Ensure directories exist
            Directory.CreateDirectory(Path.GetDirectoryName(originalPath));
            Directory.CreateDirectory(Path.GetDirectoryName(viewPath));
            Directory.CreateDirectory(Path.GetDirectoryName(thumbnailPath));
        
            // Create a FileModel instance with required fields
            var fileModel = new FileModel
            {
                Name = Path.GetFileNameWithoutExtension(imageFile.FileName),
                Extension = Path.GetExtension(imageFile.FileName),
                ThumbnailPath = thumbnailPath,
                ViewPath = viewPath,
                OriginalPath = originalPath,
                PixelWidth = 0,  // Will be updated when image is loaded
                PixelHeight = 0, // Will be updated when image is loaded
                User = currentUser,
                UserId = currentUser.Id
            };
        
            // Load the image using ImageSharp
            using (var stream = imageFile.OpenReadStream())
            using (var image = Image.Load(stream))
            {
                // Set image dimensions
                fileModel.PixelWidth = image.Width;
                fileModel.PixelHeight = image.Height;
                fileModel.Palette = true;
        
                // Check for EXIF metadata
                var exifProfile = image.Metadata.ExifProfile;
                if (exifProfile != null)
                {
                    // Extract common EXIF metadata
                    ExtractExifMetadata(exifProfile, fileModel);
                }
            }
        
            return fileModel;
        }
        
        private void ExtractExifMetadata(ImageSharpExif.ExifProfile exifProfile, FileModel fileModel)
        {
            object? latRef = null;
            object? lonRef = null;
            foreach (var tag in exifProfile.Values)
            {
                if (tag.Tag == ImageSharpExifTag.GPSLatitudeRef)
                {
                    latRef = tag.GetValue();
                } else if (tag.Tag == ImageSharpExifTag.GPSLongitudeRef)
                {
                    lonRef = tag.GetValue();
                }
                else if (tag.Tag == ImageSharpExifTag.GPSLatitude)
                {
                    fileModel.GPSLat = ConvertDMSToDecimal(tag.GetValue(), latRef?.ToString());
                }
                else if (tag.Tag == ImageSharpExifTag.GPSLongitude)
                {
                    fileModel.GPSLon = ConvertDMSToDecimal(tag.GetValue(), lonRef?.ToString());
                }
                else if (tag.Tag == ImageSharpExifTag.GPSAltitude && tag.GetValue() is SixLabors.ImageSharp.Rational altitudeRational)
                {
                    fileModel.GPSAlt = (decimal) altitudeRational.ToDouble();
                }
                // else if (tag.Tag == ImageSharpExifTag.DateTimeOriginal && tag.GetValue() is string dateTimeStr && DateTime.TryParse(dateTimeStr, out DateTime parsedDate))
                // {
                //     fileModel.DateTimeOriginal = parsedDate;
                // } // we did not take any date since it will be overwriten anyway
                else if (tag.Tag == ImageSharpExifTag.Make)
                {
                    fileModel.Make = tag.GetValue()?.ToString();
                }
                else if (tag.Tag == ImageSharpExifTag.Model)
                {
                    fileModel.Model = tag.GetValue()?.ToString();
                }
                else if (tag.Tag == ImageSharpExifTag.Copyright)
                {
                    fileModel.Copyright = tag.GetValue()?.ToString();
                }
                else if (tag.Tag == ImageSharpExifTag.FocalLength)
                {
                    if (tag.GetValue() is SixLabors.ImageSharp.Rational rational)
                    {
                        fileModel.FocalLength = (int) rational.ToDouble();
                    }
                }
                else if (tag.Tag == ImageSharpExifTag.FNumber)
                {
                    if (tag.GetValue() is SixLabors.ImageSharp.Rational rational)
                    {
                        fileModel.Aperture = (float) rational.ToDouble();
                    }
                }
                else
                {
                    // do nothing to the tag that we do not need
                }
            }
        }
    
        private decimal? ConvertDMSToDecimal(object dmsValue, string? reference)
        {
            if (dmsValue is SixLabors.ImageSharp.Rational[] dmsArray && dmsArray.Length == 3)
            {
                decimal degrees = (decimal)dmsArray[0].ToDouble();
                decimal minutes = (decimal)dmsArray[1].ToDouble();
                decimal seconds = (decimal)dmsArray[2].ToDouble();

                decimal decimalDegrees = degrees + (minutes / 60) + (seconds / 3600);

                if (reference == "S" || reference == "W")
                {
                    decimalDegrees = -decimalDegrees;
                }

                return decimalDegrees;
            }

            return null;
        }

        public  void PrintImageMetadata(string imagePath)
        {
            // Load the image
            using (Image image = Image.Load(imagePath))
            {
                Console.WriteLine($"Image loaded with dimensions: {image.Width}x{image.Height}");

                // Check for EXIF metadata
                if (image.Metadata.ExifProfile != null)
                {
                    Console.WriteLine("\nEXIF Metadata:");
                    foreach (var tag in image.Metadata.ExifProfile.Values)
                    {
                        Console.WriteLine($"Tag: {tag.Tag}, Value: {tag.GetValue()}");
                    }
                }
                else
                {
                    Console.WriteLine("\nNo EXIF metadata found in the image.");
                }
            }
        }

        // Extract EXIF data from the file using ExifTool
        public Dictionary<string, string> ExtractExifData(string file)
        {
            var metadata = new Dictionary<string, string>();

            try
            {
                // TODO:  Run ExifTool on the file and capture output
                // nedded fields can be seen on ER diagram
              
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error extracting EXIF data from {file}: {ex.Message}");
            }

            return metadata;
        }

       
    }
}
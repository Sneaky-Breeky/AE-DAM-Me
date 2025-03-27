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
        public async Task<string> UploadJpgPng(IFormFile file, CompressionLevel option)
        {
            if (file == null || file.Length == 0)
            {
                throw new Exception("Invalid file.");
            }

            // Validate file type
            var allowedExtensionsPhoto = new[] { ".jpg", ".jpeg", ".png"};
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensionsPhoto.Contains(fileExtension))
            {
                throw new Exception("Only JPG or PNG files are allowed.");
            }

            // Define compression settings based on option
            int quality;
            int maxWidth;
            int maxHeight;

            // Save compressed image
            string resolution;
            switch (option)
            {
                case CompressionLevel.Low:
                    quality = 30; // Reduce quality to 30%
                    maxWidth = 800; // Resize width
                    maxHeight = 600;
                    resolution = "low";
                    break;
                case CompressionLevel.Medium:
                    quality = 60; // Medium quality
                    maxWidth = 1600;
                    maxHeight = 1200;
                    resolution = "medium";
                    break;
                case CompressionLevel.High:
                    quality = 100; // Keep original quality
                    maxWidth = int.MaxValue;
                    maxHeight = int.MaxValue;
                    resolution = "high";
                    break;
                default:
                    throw new Exception("Invalid compression level.");
            }

        
            var filePath = Path.Combine(_uploadPath, string.Concat(resolution, file.FileName));

            using (var stream = file.OpenReadStream())
            using (var image = await Image.LoadAsync(stream))
            {
                // Resize the image if needed
                if (option != CompressionLevel.High)
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Max,
                        Size = new Size(maxWidth, maxHeight)
                    }));
                }

                // Save as JPEG with the defined quality
                await image.SaveAsync(filePath, new JpegEncoder { Quality = quality });
            }

            return file.FileName;
        }

       	public async Task<string> UploadRaw(IFormFile file, CompressionLevel option)
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
        
            uint quality;
			string resolution;
            switch (option)
            {
                case CompressionLevel.Low:
                    quality = 30;
					resolution = "low";
                    break;
                case CompressionLevel.Medium:
                    quality = 60;
					resolution = "medium";
                    break;
                case CompressionLevel.High:
                    quality = 100;
					resolution = "high";
                    break;
                default:
                    throw new Exception("Invalid compression level.");
            }
        
            var outputFilePath = Path.Combine(_uploadPath, resolution + Path.ChangeExtension(file.FileName, ".jpg"));
        
            try
            {
                using (var stream = file.OpenReadStream())
                {
                    var settings = new MagickReadSettings
                    {
                        Density = new Density(300)
                        // Removed IgnoreWarnings since it's not available in this version.
                    };
        
                    // Explicitly set the format based on the file extension.
                    switch (fileExtension)
                    {
                        case ".cr2":
                            settings.Format = MagickFormat.Cr2;
                            break;
                        case ".nef":
                            settings.Format = MagickFormat.Nef;
                            break;
                        case ".arw":
                            settings.Format = MagickFormat.Arw;
                            break;
                        case ".dng":
                            settings.Format = MagickFormat.Dng;
                            break;
                        // For other RAW types, you can let ImageMagick auto-detect by not setting the format.
                    }
        
                    using (var image = new MagickImage(stream, settings))
                    {
						image.AutoOrient(); // Corrects orientation based on EXIF data
                        image.Format = MagickFormat.Jpeg;
                        image.Quality = quality;
                        await image.WriteAsync(outputFilePath);
                    }
                }
                
                return outputFilePath;
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


        public async Task<string> UploadMp4(IFormFile file, CompressionLevel option)
        {
            if (file == null || file.Length == 0)
                throw new Exception("Invalid file.");

            var tempFilePath = Path.GetTempFileName() + ".mp4";  // Temporary input file


            // Save the uploaded file to disk
            using (var stream = new FileStream(tempFilePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
        string bitrate;
        string compressionArgs;
        switch (option)
        {
            case CompressionLevel.Low:
                compressionArgs = "-crf 32";
                bitrate = "32"; // Lower quality
                break;
            case CompressionLevel.Medium:
                compressionArgs = "-crf 28";
                bitrate = "28"; // Medium quality
                break;
            case CompressionLevel.High:
                compressionArgs = "-crf 23";
                bitrate = "23"; // High quality
                break;
            default:
                throw new Exception("Invalid compression level.");
        }
            

            var outputFilePath = Path.Combine(_uploadPath, bitrate + file.FileName);
            // FFmpeg command
            string ffmpegArgs = $"-i \"{tempFilePath}\" {"-c:v libx264 -pix_fmt yuv420p " + compressionArgs + " -threads 4 -preset superfast"} \"{outputFilePath}\"";
            // Execute FFmpeg
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
                string output = await process.StandardError.ReadToEndAsync(); // Capture errors
                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    throw new Exception($"FFmpeg failed: {output}");
                }
            }


            return file.FileName;
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

        public void EditFile(string file, string action)
        {
            // Stub for editing file actions (crop, rotate, highlight, resize)
            // Call respective helper for each action

            switch (action.ToLower())
            {
                case "crop":
                    // TODO: Call Crop function
                    break;
                case "rotate":
                    // TODO: Call Rotate function
                    break;
                case "highlight":
                    // TODO: Call Highlight function
                    break;
                case "resize":
                    // TODO: Call Resize function
                    break;
                default:
                    throw new ArgumentException("Unknown action");
            }
        }
        
        // Method to upload files to a project
        public void UploadToProject(int projectId)
        {
            // Stub for uploading files to project
            // TODO:
            // - Validate if files ar`e added
            // - Ensure project is selected
            // - Set resolution (low, medium, high)
        }
    }
}
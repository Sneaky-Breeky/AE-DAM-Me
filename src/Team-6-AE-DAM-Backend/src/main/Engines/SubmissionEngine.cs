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


namespace DAMBackend.SubmissionEngineEnv
{
    
    public class SubmissionEngine
    {
		public readonly string _uploadPath = "";

        public SubmissionEngine()
        {
        }
        public async Task<IFormFile> CompressImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                throw new Exception("Invalid file.");
            }

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

            // Check the file extension and call the appropriate method based on the type
            if (new[] { ".arw", ".cr2", ".nef", ".dng", ".raw"}.Contains(fileExtension))
            {
                // Call the GenerateThumbnailRaw for RAW files
                return await UploadRaw(file, ImageResolution.Medium);
            }
        	else if (new[] { ".mp4" }.Contains(fileExtension))
            {
                // Call the GenerateThumbnailJpgPng for JPG/PNG files
                return await GenerateMp4ThumbnailAsyncMedium(file);
            }
            else if (new[] { ".jpg", ".jpeg", ".png" }.Contains(fileExtension))
            {
                // Call the GenerateThumbnailJpgPng for JPG/PNG files
                return await UploadJpgPng(file, ImageResolution.Medium);
            }
            else
            {
                throw new Exception("Unsupported file format for thumbnail generation.");
            }
        }
        
        // handle raw and .mp4 image thumbnail
        public async Task<IFormFile> CompressImageHigh(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                throw new Exception("Invalid file.");
            }

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

            // Check the file extension and call the appropriate method based on the type
            if (new[] { ".arw", ".cr2", ".nef", ".dng", ".raw"}.Contains(fileExtension))
            {
                // Call the GenerateThumbnailRaw for RAW files
                return await UploadRaw(file, ImageResolution.High);
            }
            else if (new[] { ".mp4" }.Contains(fileExtension))
            {
                // Call the GenerateThumbnailJpgPng for JPG/PNG files
                return await GenerateMp4ThumbnailAsyncMedium(file);
            }
            else
            {
                throw new Exception("Unsupported file format for thumbnail generation.");
            }
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
        public async Task<IFormFile> UploadJpgPng(IFormFile file, ImageResolution option)
        {
        
            // Compression settings
            int quality;
            int maxWidth;
            int maxHeight;
            switch (option)
            {
                case ImageResolution.Low:
                    quality = 30;
                    maxWidth = 800;
                    maxHeight = 600;
                    break;
                case ImageResolution.Medium:
                    quality = 60;
                    maxWidth = 1600;
                    maxHeight = 1200;
                    break;
                case ImageResolution.High:
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
                if (option != ImageResolution.High)
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


		// compression method for RAW file
        public async Task<IFormFile> UploadRaw(IFormFile file, ImageResolution option)
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
        
            // Define quality by resolution level
            uint quality = option switch
            {
                ImageResolution.Low => 20u,
                ImageResolution.Medium => 60u,
                ImageResolution.High => 90u,
                _ => 60u
            };
        
            try
            {
                using (var stream = file.OpenReadStream())
                {
                    var settings = new MagickReadSettings
                    {
                        Density = new Density(300),
                        Format = fileExtension switch
                        {
                            ".cr2" => MagickFormat.Cr2,
                            ".nef" => MagickFormat.Nef,
                            ".arw" => MagickFormat.Arw,
                            ".dng" => MagickFormat.Dng,
                            _ => MagickFormat.Unknown
                        }
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

        
        
        public async Task<IFormFile> GenerateMp4ThumbnailAsyncMedium(IFormFile videoFile)
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
                string ffmpegArgs = $"-ss 00:00:00 -i \"{tempVideoPath}\" -vframes 1 -q:v 1 \"{tempThumbnailPath}\"";
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


        public async Task<IFormFile> UploadMp4(IFormFile file, ImageResolution option)
        {
            if (file == null || file.Length == 0)
                throw new Exception("Invalid file.");
        
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (fileExtension != ".mp4")
                throw new Exception("Only MP4 files are supported.");
        
            if (option == ImageResolution.High)
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
                ImageResolution.Low => "-crf 32",
                ImageResolution.Medium => "-crf 28",
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

		// ----------------------------------- thumbnail generation --------------------------------

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


		// ----------------------------------- metadata extraction --------------------------------

		public FileModel ProcessImageMetadata(IFormFile file, string basePath, UserModel currentUser)
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
                return ProcessImageMetadataRaw(file, basePath, currentUser);
            }
			else if (new[] { ".mp4" }.Contains(fileExtension))
            {
                // Call the GenerateThumbnailJpgPng for JPG/PNG files
                return ProcessImageMetadataMp4(file, basePath, currentUser);
            }
            else if (new[] { ".jpg", ".jpeg", ".png" }.Contains(fileExtension))
            {
                // Call the GenerateThumbnailJpgPng for JPG/PNG files
                return ProcessImageMetadataJpgPng(file, basePath, currentUser);
            }
            else
            {
                throw new Exception("Unsupported file format for thumbnail generation.");
            }
        }
        
        private FileModel ProcessImageMetadataJpgPng(IFormFile imageFile, string basePath, UserModel currentUser)
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

		// process metadata for raw format
		private FileModel ProcessImageMetadataRaw(IFormFile rawFile, string basePath, UserModel currentUser)
        {
            // Validate input
            if (rawFile == null || rawFile.Length == 0)
            {
                throw new ArgumentException("Invalid raw file");
            }
    
            // Ensure the file is either .raw or .arw
            string extension = Path.GetExtension(rawFile.FileName).ToLowerInvariant();
            if (extension != ".raw" && extension != ".arw")
            {
                throw new ArgumentException("Unsupported file format. Only .raw and .arw files are supported.");
            }
    
            // Get the original file name (keep it as is)
            string originalFileName = rawFile.FileName;
			string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(originalFileName);

    
            // Create a temporary file path using the original file name
            string tempFilePath = Path.Combine(Path.GetTempPath(), originalFileName);
    
            try
            {
                // Save the raw file to the temporary location
                using (var fileStream = new FileStream(tempFilePath, FileMode.Create))
                {
                    rawFile.CopyTo(fileStream);
                }
    
                // Run ExifTool to extract metadata
                string exifToolArgs = $"\"{tempFilePath}\""; // ExifTool command to extract metadata
    
                var startInfo = new ProcessStartInfo("exiftool", exifToolArgs)
                {
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
    
                using (var process = Process.Start(startInfo))
                using (var reader = process.StandardOutput)
                {
                    // Read the output from ExifTool
                    string output = reader.ReadToEnd();
    
                    // Split the output by new lines and process each tag
                    string[] lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                    
                    // Create FileModel instance and assign default values
                    var fileModel = new FileModel
                    {
                        Name = fileNameWithoutExtension,
                        Extension = extension,
                        ThumbnailPath = Path.Combine(basePath, "thumbnails", originalFileName),
                        ViewPath = Path.Combine(basePath, "views", originalFileName),
                        OriginalPath = Path.Combine(basePath, "originals", originalFileName),
                        PixelWidth = 0,
                        PixelHeight = 0,
                        User = currentUser,
                        UserId = currentUser.Id,
						Palette = true
                    };
    
                    // Process each metadata line
                    foreach (var line in lines)
                    {
                        // Split metadata line into tag and value
                        var parts = line.Split(":", 2);
                        if (parts.Length < 2) continue;  // Skip invalid lines
    
                        string tag = parts[0].Trim();
                        string value = parts[1].Trim();
    
                        // Check each metadata tag and assign to the correct field using if-else
                        if (tag == "File Name")
                        {
                            // No need to assign since it's already assigned from the original file name
                        }
                        else if (tag == "Make") // // Assign to Make
                        {
                            fileModel.Make = value;
                        }
                        else if (tag == "Camera Model Name") // // Assign to Model
                        {
                            fileModel.Model = value;
                        }
                        else if (tag == "Focal Length") // // Assign to FocalLength
                        {
                            if (int.TryParse(value, out int focalLength))
                            {
                                fileModel.FocalLength = focalLength;
                            }
                        }
                        else if (tag == "Aperture") // // Assign to Aperture
                        {
                            if (float.TryParse(value, out float aperture))
                            {
                                fileModel.Aperture = aperture;
                            }
                        }
                        else if (tag == "Date/Time Original") // // Assign to DateTimeOriginal
                        {
                            if (DateTime.TryParse(value, out DateTime dateTime))
                            {
                                fileModel.DateTimeOriginal = dateTime;
                            }
                        }
                        else if (tag == "Copyright") // // Assign to Copyright
                        {
                            fileModel.Copyright = value;
                        }
                        else if (tag == "GPS Latitude") // // Assign to GPSLat
                        {
                            if (decimal.TryParse(value, out decimal latitude))
                            {
                                fileModel.GPSLat = latitude;
                            }
                        }
                        else if (tag == "GPS Longitude") // // Assign to GPSLon
                        {
                            if (decimal.TryParse(value, out decimal longitude))
                            {
                                fileModel.GPSLon = longitude;
                            }
                        }
                        else if (tag == "GPS Altitude") // // Assign to GPSAlt
                        {
                            if (decimal.TryParse(value, out decimal altitude))
                            {
                                fileModel.GPSAlt = altitude;
                            }
                        }
                        else if (tag == "Image Width") // // Assign to PixelWidth
                        {
                            if (int.TryParse(value, out int width))
                            {
                                fileModel.PixelWidth = width;
                            }
                        }
                        else if (tag == "Image Height") // // Assign to PixelHeight
                        {
                            if (int.TryParse(value, out int height))
                            {
                                fileModel.PixelHeight = height;
                            }
                        }
                        else
                        {
                            // Handle or ignore other metadata tags as needed
                        }
                    }
    
                    // Return the populated FileModel
                    return fileModel;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                return null;
            }
            finally
            {
                // Clean up the temporary file
                if (File.Exists(tempFilePath))
                {
                    File.Delete(tempFilePath);
                }
            }
        }

		private FileModel ProcessImageMetadataMp4(IFormFile videoFile, string basePath, UserModel currentUser)
        {
            // Validate input
            if (videoFile == null || videoFile.Length == 0)
            {
                throw new ArgumentException("Invalid MP4 file");
            }
        
            // Ensure the file is a .mp4
            string extension = Path.GetExtension(videoFile.FileName).ToLowerInvariant();
            if (extension != ".mp4")
            {
                throw new ArgumentException("Only .mp4 files are supported.");
            }
        
            // Get the original file name (keep it as is)
            string originalFileName = videoFile.FileName;
            string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(originalFileName);
        
            // Create a temporary file path using the original file name
            string tempFilePath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + extension);
        
            try
            {
                // Save the .mp4 file to a temporary location
                using (var fileStream = new FileStream(tempFilePath, FileMode.Create))
                {
                    videoFile.CopyTo(fileStream);
                }
        
                // Run ffprobe to extract metadata from the video file in JSON format
                string ffprobeArgs = $"-v quiet -print_format json -show_format -show_streams \"{tempFilePath}\"";
        
                var startInfo = new ProcessStartInfo("ffprobe", ffprobeArgs)
                {
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
        
                using (var process = Process.Start(startInfo))
                using (var reader = process.StandardOutput)
                {
                    // Read the output from ffprobe
                    string output = reader.ReadToEnd();
        
                    // Deserialize JSON output
                    var metadata = Newtonsoft.Json.Linq.JObject.Parse(output);
        
                    // Create FileModel instance and assign default values
                    var fileModel = new FileModel
                    {
                        Name = fileNameWithoutExtension,
                        Extension = extension,
                        ThumbnailPath = Path.Combine(basePath, "thumbnails", originalFileName),
                        ViewPath = Path.Combine(basePath, "views", originalFileName),
                        OriginalPath = Path.Combine(basePath, "originals", originalFileName),
                        PixelWidth = 0,
                        PixelHeight = 0,
                        User = currentUser,
                        UserId = currentUser.Id,
                        Palette = true
                    };
        
                    // Extract width and height from streams
                    var videoStream = metadata["streams"]?.FirstOrDefault(stream => stream["codec_type"]?.ToString() == "video");
                    if (videoStream != null)
                    {
                        // Extract width and height from the video stream metadata
                        int width = videoStream["width"]?.ToObject<int>() ?? 0;
                        int height = videoStream["height"]?.ToObject<int>() ?? 0;
        
                        // Assign extracted width and height to the file model
                        fileModel.PixelWidth = width;
                        fileModel.PixelHeight = height;
                    }
        
                    // Return the populated FileModel
                    return fileModel;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                return null;
            }
            finally
            {
                // Clean up the temporary file
                if (File.Exists(tempFilePath))
                {
                    File.Delete(tempFilePath);
                }
            }
        }


		// ------------------------------------------ disposable methods for debugging -----------------------------
		// public void PrintMp4Metadata(IFormFile videoFile)
//     {
//         // Validate input
//         if (videoFile == null || videoFile.Length == 0)
//         {
//             throw new ArgumentException("Invalid video file");
//         }
//
//         // Ensure the file is a .mp4 file
//         string extension = Path.GetExtension(videoFile.FileName).ToLowerInvariant();
//         if (extension != ".mp4")
//         {
//             throw new ArgumentException("Only .mp4 files are supported.");
//         }
//
//         // Create a temporary file path
//         string tempFilePath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + extension);
//
//         try
//         {
//             // Save the .mp4 file to a temporary location
//             using (var fileStream = new FileStream(tempFilePath, FileMode.Create))
//             {
//                 videoFile.CopyTo(fileStream);
//             }
//
//             // Run ffprobe to extract metadata from the video file
//             string ffprobeArgs = $"-v quiet -print_format json -show_format -show_streams \"{tempFilePath}\""; // FFprobe command to extract metadata
//
//             var startInfo = new ProcessStartInfo("ffprobe", ffprobeArgs)
//             {
//                 RedirectStandardOutput = true,
//                 RedirectStandardError = true,
//                 UseShellExecute = false,
//                 CreateNoWindow = true
//             };
//
//             using (var process = Process.Start(startInfo))
//             using (var reader = process.StandardOutput)
//             {
//                 // Read the output from ffprobe
//                 string output = reader.ReadToEnd();
//
//                 // Deserialize JSON output
//                 var metadata = Newtonsoft.Json.Linq.JObject.Parse(output);
//
//                 // Loop through and print each stream and format metadata
//                 Console.WriteLine("Metadata for Video:");
//
//                 // Print general file information from "format"
//                 foreach (var item in metadata["format"])
//                 {
//                     Console.WriteLine($"{item.Path}: {item.First}");
//                 }
//
//                 // Print stream information (video and audio streams)
//                 foreach (var stream in metadata["streams"])
//                 {
//                     foreach (var item in stream)
//                     {
//                         Console.WriteLine($"{item.Path}: {item.First}");
//                     }
//                 }
//             }
//         }
//         catch (Exception ex)
//         {
//             Console.WriteLine($"Error: {ex.Message}");
//         }
//         finally
//         {
//             // Clean up the temporary file
//             if (File.Exists(tempFilePath))
//             {
//                 File.Delete(tempFilePath);
//             }
//         }
//     }
//
// 		public void PrintRawMetadata(IFormFile rawFile)
//     {
//         // Validate input
//         if (rawFile == null || rawFile.Length == 0)
//         {
//             throw new ArgumentException("Invalid raw file");
//         }
//
//         // Ensure the file is either .raw or .arw
//         string extension = Path.GetExtension(rawFile.FileName).ToLowerInvariant();
//         if (extension != ".raw" && extension != ".arw")
//         {
//             throw new ArgumentException("Unsupported file format. Only .raw and .arw files are supported.");
//         }
//
//         // Get the original file name (keep it as is)
//         string originalFileName = rawFile.FileName;
//         
//         // Create a temporary file path using the original file name
//         string tempFilePath = Path.Combine(Path.GetTempPath(), originalFileName);
//
//         try
//         {
//             // Save the raw file to the temporary location with its original name
//             using (var fileStream = new FileStream(tempFilePath, FileMode.Create))
//             {
//                 rawFile.CopyTo(fileStream);
//             }
//
//             // Run ExifTool to extract metadata
//             string exifToolArgs = $"\"{tempFilePath}\""; // ExifTool command to extract metadata
//
//             var startInfo = new ProcessStartInfo("exiftool", exifToolArgs)
//             {
//                 RedirectStandardOutput = true,
//                 RedirectStandardError = true,
//                 UseShellExecute = false,
//                 CreateNoWindow = true
//             };
//
//             using (var process = Process.Start(startInfo))
//             using (var reader = process.StandardOutput)
//             {
//                 // Read the output from ExifTool
//                 string output = reader.ReadToEnd();
//
//                 // Split the output by new lines and print each tag
//                 string[] lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
//                 foreach (var line in lines)
//                 {
//                     Console.WriteLine(line);  // Print each metadata tag line
//                 }
//             }
//         }
//         catch (Exception ex)
//         {
//             Console.WriteLine($"Error: {ex.Message}");
//         }
//         finally
//         {
//             // Clean up the temporary file
//             if (File.Exists(tempFilePath))
//             {
//                 File.Delete(tempFilePath);
//             }
//         }
//     }
//
//         public  void PrintImageMetadata(string imagePath)
//         {
//             // Load the image
//             using (Image image = Image.Load(imagePath))
//             {
//                 Console.WriteLine($"Image loaded with dimensions: {image.Width}x{image.Height}");
//
//                 // Check for EXIF metadata
//                 if (image.Metadata.ExifProfile != null)
//                 {
//                     Console.WriteLine("\nEXIF Metadata:");
//                     foreach (var tag in image.Metadata.ExifProfile.Values)
//                     {
//                         Console.WriteLine($"Tag: {tag.Tag}, Value: {tag.GetValue()}");
//                     }
//                 }
//                 else
//                 {
//                     Console.WriteLine("\nNo EXIF metadata found in the image.");
//                 }
//             }
//         }
//
//         // Extract EXIF data from the file using ExifTool
//         public Dictionary<string, string> ExtractExifData(string file)
//         {
//             var metadata = new Dictionary<string, string>();
//
//             try
//             {
//                 // TODO:  Run ExifTool on the file and capture output
//                 // nedded fields can be seen on ER diagram
//               
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error extracting EXIF data from {file}: {ex.Message}");
//             }
//
//             return metadata;
//         }

       
    }
}

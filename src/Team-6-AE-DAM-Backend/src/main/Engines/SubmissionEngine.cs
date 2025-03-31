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

namespace DAMBackend.SubmissionEngine
{
    public enum CompressionLevel
    {
        Low,
        Medium,
        High
    }
    public class SubmissionEngine
    {
        public SubmissionEngine(){
        }

        public async void UploadFiles(List<IFormFile> files, CompressionLevel compressLevel)
        {
            if (files.Count > 100){
                return;
            }
            List<IFormFile> validFiles = await filterValidFiles(files);
            List<IFormFile> compressedFiles = await CompressFiles(validFiles,compressLevel);
        }
         public async Task<List<IFormFile>> filterValidFiles(List<IFormFile> files) {
               List<IFormFile> validFiles = new List<IFormFile>();
               var allowedExtensionsPhoto = new[] { ".jpg", ".jpeg", ".png", ".raw", ".arw" };
               var allowedExtensionsVideo = new[] { ".mp4" };

            foreach (var file in files)
            {
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (file == null  || file.Length == 0){
                continue;
                }
                if ((!allowedExtensionsPhoto.Contains(fileExtension) &&
                    !allowedExtensionsVideo.Contains(fileExtension))||
                    (file.Length > 500 * 1024 * 1024))
                {
                    continue;
                }
                validFiles.Add(file);
                }
            return validFiles;
        }

        public async Task<List<IFormFile>> CompressFiles(List<IFormFile> files, CompressionLevel compressLevel)
        {
        List<IFormFile> compressFiles = new List<IFormFile>();
        var allowedExtensionsPhoto = new[] { ".jpg", ".jpeg", ".png", ".raw", ".arw" };
        var allowedExtensionsVideo = new[] { ".mp4" };

        foreach (var file in files){
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if(fileExtension == ".jpg" || fileExtension == ".jpeg"|| fileExtension == ".png"){
                compressFiles.Add(await CompressJpgPng(file,compressLevel));
            }
            else if(fileExtension == ".raw" || fileExtension == ".arw"){
                 compressFiles.Add(await CompressRaw(file,compressLevel));
            }
            else if(fileExtension == ".mp4"){
                compressFiles.Add(await CompressMp4(file,compressLevel));
            }
           }
           return compressFiles;
        }
        public async Task<IFormFile> CompressJpgPng(IFormFile file, CompressionLevel option){
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
                            if (option != CompressionLevel.High)
                            {
                                image.Mutate(x => x.Resize(new ResizeOptions
                                {
                                    Mode = ResizeMode.Max,
                                    Size = new Size(maxWidth, maxHeight)
                                }));
                            }

                            await image.SaveAsync(outputStream, new JpegEncoder { Quality = quality });
                        }

                        outputStream.Position = 0;

                        var compressedFile = new FormFile(outputStream, 0, outputStream.Length, file.Name, file.FileName)
                        {
                            Headers = file.Headers,
                            ContentType = "image/jpeg"
                        };
                        return compressedFile;
        }

       	public async Task<IFormFile> CompressRaw(IFormFile file, CompressionLevel option){
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

        public async Task<IFormFile> CompressMp4(IFormFile file, CompressionLevel option){
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

//
//        public void EditFile(string file, string action)
//        {
//            // Stub for editing file actions (crop, rotate, highlight, resize)
//            // Call respective helper for each action
//
//            switch (action.ToLower())
//            {
//                case "crop":
//                    // TODO: Call Crop function
//                    break;
//                case "rotate":
//                    // TODO: Call Rotate function
//                    break;
//                case "highlight":
//                    // TODO: Call Highlight function
//                    break;
//                case "resize":
//                    // TODO: Call Resize function
//                    break;
//                default:
//                    throw new ArgumentException("Unknown action");
//            }
//        }
//
//        // Method to upload files to a project
//        public void UploadToProject(int projectId)
//        {
//            // Stub for uploading files to project
//            // TODO:
//            // - Validate if files ar`e added
//            // - Ensure project is selected
//            // - Set resolution (low, medium, high)
//        }

//    }
}
}
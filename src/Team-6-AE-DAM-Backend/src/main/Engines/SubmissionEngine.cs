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
        public SubmissionEngine(List<IFormFile> files, CompressionLevel compressLevel){
        }

        public async Task<List<string>> UploadFiles(List<IFormFile> files)
        {
            if (files.Count > 100){
                return;
            }
            List<IFormFile> validFiles = filterValidFiles(files);
            List<IFormFile> compressedFiles = filterValidFiles(validFiles);
        }
         public async Task<List<string>> filterValidFiles(List<IFormFile> files) {
               List<IFormFile> validFiles = new List<IFormFile>();
               var allowedExtensionsPhoto = new[] { ".jpg", ".jpeg", ".png", ".raw", ".arw" };
               var allowedExtensionsVideo = new[] { ".mp4" };

            foreach (var file in files)
            {
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (file == null  || file.Length == 0){
                continue;
                }
                if (!allowedExtensionsPhoto.Contains(fileExtension) && !allowedExtensionsVideo.Contains(fileExtension))
               || (file.Length > 500 * 1024 * 1024))
                {
                    continue;
                }
                validFile.Add(file);
                }
            return validFiles;
        }

        public async Task<string> CompressFiles(List<IFormFile> files, CompressionLevel compressLevel)
        {
        List<IFormFile> compressFiles = new List<IFormFile>();
        var allowedExtensionsPhoto = new[] { ".jpg", ".jpeg", ".png", ".raw", ".arw" };
        var allowedExtensionsVideo = new[] { ".mp4" };

        foreach (var file in files){
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if(fileExtension == ".jpg" || fileExtension == ".jpeg"|| fileExtension == ".png"){
                compressFiles.Add(CompressJpgPng(file,compressLevel));
            }
            else if(fileExtension == ".raw" || fileExtension == ".arw"){
                 compressFiles.Add(CompressJpgPng(file,compressLevel));
            }
            else if(fileExtension == ".mp4"){
                compressFiles.Add(CompressMp4(file,compressLevel));
            }
           }
           return compressFiles;
        }
        public async Task<string> CompressJpgPng(IFormFile file, CompressionLevel option){
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

       	public async Task<string> CompressRaw(IFormFile file, CompressionLevel option){
       	    return file;
       	}

        public async Task<string> CompressMp4(IFormFile file, CompressionLevel option){
            return file;
        }


//        public FileModel ProcessImageMetadataJpgPng(IFormFile imageFile, string basePath, UserModel currentUser)
//        {
//            // Validate input
//            if (imageFile == null || imageFile.Length == 0)
//            {
//                throw new ArgumentException("Invalid image file");
//            }
//
//            // Generate unique file paths
//            string originalPath = Path.Combine(basePath, "originals", imageFile.FileName);
//            string viewPath = Path.Combine(basePath, "views", imageFile.FileName);
//            string thumbnailPath = Path.Combine(basePath, "thumbnails", imageFile.FileName);
//
//            // Ensure directories exist
//            Directory.CreateDirectory(Path.GetDirectoryName(originalPath));
//            Directory.CreateDirectory(Path.GetDirectoryName(viewPath));
//            Directory.CreateDirectory(Path.GetDirectoryName(thumbnailPath));
//
//            // Create a FileModel instance with required fields
//            var fileModel = new FileModel
//            {
//                Name = Path.GetFileNameWithoutExtension(imageFile.FileName),
//                Extension = Path.GetExtension(imageFile.FileName),
//                ThumbnailPath = thumbnailPath,
//                ViewPath = viewPath,
//                OriginalPath = originalPath,
//                PixelWidth = 0,  // Will be updated when image is loaded
//                PixelHeight = 0, // Will be updated when image is loaded
//                User = currentUser,
//                UserId = currentUser.Id
//            };
//
//            // Load the image using ImageSharp
//            using (var stream = imageFile.OpenReadStream())
//            using (var image = Image.Load(stream))
//            {
//                // Set image dimensions
//                fileModel.PixelWidth = image.Width;
//                fileModel.PixelHeight = image.Height;
//                fileModel.Palette = true;
//
//                // Check for EXIF metadata
//                var exifProfile = image.Metadata.ExifProfile;
//                if (exifProfile != null)
//                {
//                    // Extract common EXIF metadata
//                    ExtractExifMetadata(exifProfile, fileModel);
//                }
//            }
//
//            return fileModel;
//        }
//
//        private void ExtractExifMetadata(ImageSharpExif.ExifProfile exifProfile, FileModel fileModel)
//        {
//            object? latRef = null;
//            object? lonRef = null;
//            foreach (var tag in exifProfile.Values)
//            {
//                if (tag.Tag == ImageSharpExifTag.GPSLatitudeRef)
//                {
//                    latRef = tag.GetValue();
//                } else if (tag.Tag == ImageSharpExifTag.GPSLongitudeRef)
//                {
//                    lonRef = tag.GetValue();
//                }
//                else if (tag.Tag == ImageSharpExifTag.GPSLatitude)
//                {
//                    fileModel.GPSLat = ConvertDMSToDecimal(tag.GetValue(), latRef?.ToString());
//                }
//                else if (tag.Tag == ImageSharpExifTag.GPSLongitude)
//                {
//                    fileModel.GPSLon = ConvertDMSToDecimal(tag.GetValue(), lonRef?.ToString());
//                }
//                else if (tag.Tag == ImageSharpExifTag.GPSAltitude && tag.GetValue() is SixLabors.ImageSharp.Rational altitudeRational)
//                {
//                    fileModel.GPSAlt = (decimal) altitudeRational.ToDouble();
//                }
//                // else if (tag.Tag == ImageSharpExifTag.DateTimeOriginal && tag.GetValue() is string dateTimeStr && DateTime.TryParse(dateTimeStr, out DateTime parsedDate))
//                // {
//                //     fileModel.DateTimeOriginal = parsedDate;
//                // } // we did not take any date since it will be overwriten anyway
//                else if (tag.Tag == ImageSharpExifTag.Make)
//                {
//                    fileModel.Make = tag.GetValue()?.ToString();
//                }
//                else if (tag.Tag == ImageSharpExifTag.Model)
//                {
//                    fileModel.Model = tag.GetValue()?.ToString();
//                }
//                else if (tag.Tag == ImageSharpExifTag.Copyright)
//                {
//                    fileModel.Copyright = tag.GetValue()?.ToString();
//                }
//                else if (tag.Tag == ImageSharpExifTag.FocalLength)
//                {
//                    if (tag.GetValue() is SixLabors.ImageSharp.Rational rational)
//                    {
//                        fileModel.FocalLength = (int) rational.ToDouble();
//                    }
//                }
//                else if (tag.Tag == ImageSharpExifTag.FNumber)
//                {
//                    if (tag.GetValue() is SixLabors.ImageSharp.Rational rational)
//                    {
//                        fileModel.Aperture = (float) rational.ToDouble();
//                    }
//                }
//                else
//                {
//                    // do nothing to the tag that we do not need
//                }
//            }
//        }
//
//        private decimal? ConvertDMSToDecimal(object dmsValue, string? reference)
//        {
//            if (dmsValue is SixLabors.ImageSharp.Rational[] dmsArray && dmsArray.Length == 3)
//            {
//                decimal degrees = (decimal)dmsArray[0].ToDouble();
//                decimal minutes = (decimal)dmsArray[1].ToDouble();
//                decimal seconds = (decimal)dmsArray[2].ToDouble();
//
//                decimal decimalDegrees = degrees + (minutes / 60) + (seconds / 3600);
//
//                if (reference == "S" || reference == "W")
//                {
//                    decimalDegrees = -decimalDegrees;
//                }
//
//                return decimalDegrees;
//            }
//
//            return null;
//        }
//
//        public  void PrintImageMetadata(string imagePath)
//        {
//            // Load the image
//            using (Image image = Image.Load(imagePath))
//            {
//                Console.WriteLine($"Image loaded with dimensions: {image.Width}x{image.Height}");
//
//                // Check for EXIF metadata
//                if (image.Metadata.ExifProfile != null)
//                {
//                    Console.WriteLine("\nEXIF Metadata:");
//                    foreach (var tag in image.Metadata.ExifProfile.Values)
//                    {
//                        Console.WriteLine($"Tag: {tag.Tag}, Value: {tag.GetValue()}");
//                    }
//                }
//                else
//                {
//                    Console.WriteLine("\nNo EXIF metadata found in the image.");
//                }
//            }
//        }
//
//        // Extract EXIF data from the file using ExifTool
//        public Dictionary<string, string> ExtractExifData(string file)
//        {
//            var metadata = new Dictionary<string, string>();
//
//            try
//            {
//                // TODO:  Run ExifTool on the file and capture output
//                // nedded fields can be seen on ER diagram
//
//            }
//            catch (Exception ex)
//            {
//                Console.WriteLine($"Error extracting EXIF data from {file}: {ex.Message}");
//            }
//
//            return metadata;
//        }
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
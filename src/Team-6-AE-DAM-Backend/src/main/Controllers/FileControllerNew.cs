using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DAMBackend.Data;
using DAMBackend.Models;
using NuGet.Protocol;
using DAMBackend.blob;
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
using DAMBackend.SubmissionEngineEnv;
using System.IO.Compression;
using ImageSharpImage = SixLabors.ImageSharp.Image;

namespace DAMBackend.Controllers
{


    [Route("api/filesNew")]
    [ApiController]
    public class FilesControllerNew : ControllerBase
    {
            private readonly AzureBlobService _azureBlobService;
            private readonly SQLDbContext _context;

            public FilesControllerNew(SQLDbContext context, AzureBlobService azureBlobService)
            {
                _context = context;
                _azureBlobService = azureBlobService;
            }
            [HttpPost("saveToPalette/{userId}")]
            [Consumes("multipart/form-data")]
            public async Task<ActionResult<List<UpladedFile>>> UploadFiles(List<IFormFile> files, int userId)
           {
                if (files.Count > 100)
                {
                    return BadRequest("You can upload a maximum of 100 files at once.");
                }
                List<FileModel> fileModels = new List<FileModel>();
                foreach (var file in files)
                    {
                    if (!VerifyFile(file, out var errorMessage))
                            {
                                return BadRequest(errorMessage);
                            }
                        var fileModel = ProcessImageToExif(file);
                        fileModel.UserId = userId;
                        fileModels.Add(fileModel);

                        var id = Guid.NewGuid();
                        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                        var fileName = string.Concat("Original_", id.ToString(), fileExtension);
                        using var stream = file.OpenReadStream();

                        string fileUrlOriginal = await _azureBlobService.UploadAsync(file, fileName, ContainerType.Palette);

//                        _context.Files.Update(fileModel);
//                        await _context.SaveChangesAsync();
                    }

                return Ok(fileModels);
              }
           public FileModel ProcessImageToExif(IFormFile imageFile)
                   {
                       string originalPath = "not for now";
                       string viewPath = "not for now";
                       string thumbnailPath = "not for now";

                       var fileModel = new FileModel
                       {
                           Name = Path.GetFileNameWithoutExtension(imageFile.FileName),
                           Extension = Path.GetExtension(imageFile.FileName),
                           ThumbnailPath = thumbnailPath,
                           ViewPath = viewPath,
                           OriginalPath = originalPath,
                           PixelWidth = 0,
                           PixelHeight = 0,
                       };

                       using (var stream = imageFile.OpenReadStream())
                       using (var image = SixLabors.ImageSharp.Image.Load(stream))
                       {
                           fileModel.PixelWidth = image.Width;
                           fileModel.PixelHeight = image.Height;
                           fileModel.Palette = true;

                           var exifProfile = image.Metadata.ExifProfile;
                           if (exifProfile != null)
                           {
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
                           }
                           else if (tag.Tag == ImageSharpExifTag.GPSLongitudeRef)
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
                               fileModel.GPSAlt = (decimal)altitudeRational.ToDouble();
                           }
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
                                   fileModel.FocalLength = (int)rational.ToDouble();
                               }
                           }
                           else if (tag.Tag == ImageSharpExifTag.FNumber)
                           {
                               if (tag.GetValue() is SixLabors.ImageSharp.Rational rational)
                               {
                                   fileModel.Aperture = (float)rational.ToDouble();
                               }
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
           private bool VerifyFile(IFormFile file, out string errorMessage)
           {
               var allowedExtensionsPhoto = new[] { ".jpg", ".jpeg", ".png", ".raw", ".arw" };
               var allowedExtensionsVideo = new[] { ".mp4" };

               var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

               if (!allowedExtensionsPhoto.Contains(fileExtension) && !allowedExtensionsVideo.Contains(fileExtension))
               {
                   errorMessage = $"File {file.FileName} has an unsupported file type.";
                   return false;
               }

               if (file.Length > 500 * 1024 * 1024) // 500MB
               {
                   errorMessage = $"File {file.FileName} exceeds the maximum allowed size.";
                   return false;
               }

               errorMessage = string.Empty;
               return true;
           }

               }
               }

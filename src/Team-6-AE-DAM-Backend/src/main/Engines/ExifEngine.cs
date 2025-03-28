using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Linq;
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

namespace DAMBackend.Engine
{
    public class ExifEngine
    {
        public FileModel FileModelExif { get; private set; }

        public ExifEngine(IFormFile file, int userId)
        {
            FileModelExif = ProcessImageToExif(file, "need to add", userId);
        }

        public FileModel ProcessImageToExif(IFormFile imageFile, string basePath, int userId)
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
                PixelWidth = 0,  // Will be updated when image is loaded
                PixelHeight = 0, // Will be updated when image is loaded
                UserId = userId
            };

            using (var stream = imageFile.OpenReadStream())
            using (var image = Image.Load(stream))
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
    }
}

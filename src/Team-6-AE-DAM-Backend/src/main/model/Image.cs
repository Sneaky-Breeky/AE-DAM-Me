namespace DAMBackend.Data
{
    public class Image
    {
        public int ImageID { get; set; }            
        public string ImageLink { get; set; }       
        public DateTime? CaptureDateTime { get; set; }  
        public string FileType { get; set; }        
        public long FileSize { get; set; }         
        public int ImageWidth { get; set; }         
        public int ImageHeight { get; set; }        
        public decimal? Latitude { get; set; }      
        public decimal? Longitude { get; set; }     

        public Image()
        {
        }

        public Image(string imageLink, DateTime? captureDateTime, string fileType, long fileSize, 
            int imageWidth, int imageHeight, decimal? latitude, decimal? longitude)
        {
            ImageLink = imageLink;
            CaptureDateTime = captureDateTime;
            FileType = fileType;
            FileSize = fileSize;
            ImageWidth = imageWidth;
            ImageHeight = imageHeight;
            Latitude = latitude;
            Longitude = longitude;
        }
    }
}

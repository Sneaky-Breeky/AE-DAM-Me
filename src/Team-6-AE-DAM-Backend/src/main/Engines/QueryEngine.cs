using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Linq;

namespace DAMBackend.Engine
{
//    public string Name { get; set; }
    public string Status { get; set; }
    public string? Location { get; set; }
     public DateTime StartDate { get; set; }

            public QueryEngine(string status, string location, DateTime date)
            {
                Status = status;
                Location = location;
                Date = date;
            }
    }
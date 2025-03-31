using DAMBackend.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using DAMBackend.auth;
using DAMBackend.Models;
using DAMBackend.blob;
using Azure.Storage.Blobs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<CsvEngine>();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "DAM Backend API",
        Version = "v1",
        Description = "API documentation for DAM Backend"
    });
});


// var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
// note: this one should reside in appsettings.json, not here!
var allowedOrigins = new[] { "http://localhost:3000", "https://cpsc319-2025.github.io/Team-6-AE", "https://thankful-field-0410c1a1e.6.azurestaticapps.net"};

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (allowedOrigins != null && allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials()
                  .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
        }
        else
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
    });
});

builder.Services.AddSingleton(x => 
    new BlobServiceClient(builder.Configuration.GetConnectionString("StorageAccount")));

builder.Services.AddDbContext<SQLDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("AzureSQL")));

builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<AzureBlobService>();

var app = builder.Build();

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<SQLDbContext>();
        if (dbContext.Database.CanConnect())
        {
            Console.WriteLine("Successfully connected to Azure SQL Database!");
        }
        else
        {
            Console.WriteLine($"Connection to Azure SQL Database failed");
        }

        
        try
        {
            var blobService = scope.ServiceProvider.GetRequiredService<AzureBlobService>();
            Console.WriteLine("Successfully initialized Azure Blob Storage!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to initialize Azure Blob Storage: {ex.Message}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to connect to Azure SQL Database: {ex.Message}");
    }
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "DAM Backend API V1");
    c.RoutePrefix = string.Empty;
});

app.Run();

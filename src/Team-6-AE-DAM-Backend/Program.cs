using DAMBackend.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using DAMBackend.auth;
using DAMBackend.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
// note: this one should reside in appsettings.json, not here!
var allowedOrigins = new[] { "http://localhost:3000", "https://thankful-field-0410c1a1e.6.azurestaticapps.net", "http://localhost:3000/Team-6-AE"};

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

builder.Services.AddDbContext<SQLDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<AuthService>();

var app = builder.Build();

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<SQLDbContext>();
    try
    {
        if (dbContext.Database.CanConnect())
        {
            Console.WriteLine("Successfully connected to Azure SQL Database!");
        }
        else
        {
            Console.WriteLine("Connection to Azure SQL Database failed.");
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

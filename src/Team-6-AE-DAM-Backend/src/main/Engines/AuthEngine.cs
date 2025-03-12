using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using DAMBackend.Data;
using DAMBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace DAMBackend.auth
{
    public class AuthService
    {
        private readonly AppDbContext _context;

        public AuthService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> RegisterUserAsync(string email, string password)
        {
            if (await _context.Users.AnyAsync(u => u.Email == email))
                return false; // User already exists

            var hashedPassword = HashPassword(password);

            var newUser = new UserModel
            {
                FirstName = "Default", // Ensure a proper value is provided
                LastName = "User",
                Email = email,
                PasswordHash = hashedPassword,
                Role = Role.User, // Assign a default role
                Status = true
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AuthenticateUserAsync(string email, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return false; // User not found
            Console.WriteLine($"Hashed Password for {email}: {HashPassword(password)}, {user.PasswordHash}");

            return VerifyPassword(password, user.PasswordHash);
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private static bool VerifyPassword(string input, string storedHash)
        {
            return HashPassword(input) == storedHash;
        }
    }
}

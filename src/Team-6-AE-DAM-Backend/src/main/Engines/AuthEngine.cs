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
        private readonly SQLDbContext _context;

        public AuthService(SQLDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserModel>> fetchUsersAsync()
        {
            var userList = await _context.Users.ToListAsync();
            
            // return userList.Select(user => (dynamic)new {
            //     name = user.FirstName + " " + user.LastName,
            //     email = user.Email,
            //     role = user.Role,
            //     status = user.Status ? "Active" : "Inactive"
            // }).ToList();

            return userList;
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

        public async Task<UserModel?> AuthenticateUserAsync(string email, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null || !VerifyPassword(password, user.PasswordHash))
                return null;

            return user;
        }

        public async Task<bool> AddUserAsync(UserModel user)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == user.Email);
            
            if (existingUser != null)
                return false; // Email already exists

            user.PasswordHash = HashPassword(user.PasswordHash);
            
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            
            return true;
        }

        public async Task<bool> DeleteUserAsync(string email) 
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }
        
        public async Task<bool> UpdateUserAsync(string email, UserModel updatedUser)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return false;

            user.FirstName = updatedUser.FirstName;
            user.LastName = updatedUser.LastName;
            user.Role = updatedUser.Role;
            user.Status = updatedUser.Status;

            if (!string.IsNullOrWhiteSpace(updatedUser.PasswordHash))
            {
                user.PasswordHash = HashPassword(updatedUser.PasswordHash);
            }

            await _context.SaveChangesAsync();
            return true;
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

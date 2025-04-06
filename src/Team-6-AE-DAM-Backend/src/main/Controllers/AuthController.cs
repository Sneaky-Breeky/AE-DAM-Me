using Microsoft.AspNetCore.Mvc;
using DAMBackend.auth;
using DAMBackend.Models;
using System.Text.Json;

namespace backend.auth
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(AuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] LoginRequest request)
        {
            var result = await _authService.RegisterUserAsync(request.Email, request.Password);
            return result ? Ok("User registered successfully") : BadRequest("Email already exists");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _authService.AuthenticateUserAsync(request.Email, request.Password);

            if (user is null)
            {
                return Unauthorized(new { error = "Invalid email or password" });
            }
            
            // Only allow login if the user is active.
            if (!user.Status)
            {
                return Unauthorized(new { error = "User is inactive. Please contact support." });
            }

            // Return useful user details after successful login
            return Ok(new 
            { 
                message = "Login successful", 
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                role = user.Role.ToString().ToLower(),
                status = user.Status
            });
        }

        [HttpGet("fetchusers")]
        public async Task<ActionResult<IEnumerable<UserModel>>> FetchUsers()
        {
            var result = await _authService.fetchUsersAsync();

            return Ok(result);
        }

        [HttpDelete("deleteuser/{email}")]
        public async Task<IActionResult> DeleteUser(string email)
        {
            var result = await _authService.DeleteUserAsync(email);
            return result ? Ok(new { message = "User deleted successfully" }) : BadRequest(new { error = "User not found" });
        }

        [HttpPost("adduser")]
        public async Task<IActionResult> AddUser([FromBody] JsonElement jsonUser) 
        {
            try
            {
                string firstName = jsonUser.GetProperty("firstname").GetString() ?? "";
                string lastName = jsonUser.GetProperty("lastname").GetString() ?? "";
                string email = jsonUser.GetProperty("email").GetString() ?? "";
                string password = jsonUser.GetProperty("password").GetString() ?? "";
                string roleString = jsonUser.GetProperty("role").GetString() ?? "user";
                string statusString = jsonUser.GetProperty("status").GetString() ?? "inactive";

                // Convert role string to Role enum
                Role role = roleString.ToLower() == "admin" ? Role.Admin : Role.User;

                // Convert status string to boolean
                bool status = statusString.ToLower() == "active";

                // Create user model
                var user = new UserModel
                {
                    FirstName = firstName,
                    LastName = lastName,
                    Email = email,
                    PasswordHash = password,
                    Role = role,
                    Status = status
                };

                var result = await _authService.AddUserAsync(user);

                return result
                    ? Ok(new { message = "User added successfully" })
                    : BadRequest(new { error = "User already exists" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error adding user: {ex.Message}");
                return BadRequest(new { error = "Invalid user data format" });
            }
        }
        
        [HttpPut("updateuser/{email}")]
        public async Task<IActionResult> UpdateUser(string email, [FromBody] JsonElement jsonUser)
        {
            try
            {
                string? firstName = jsonUser.GetProperty("firstname").GetString();
                string? lastName = jsonUser.GetProperty("lastname").GetString();
                string? password = jsonUser.TryGetProperty("password", out var pwdProp) ? pwdProp.GetString() : null;
                string? roleString = jsonUser.GetProperty("role").GetString();
                string? statusString = jsonUser.GetProperty("status").GetString();

                Role role = roleString?.ToLower() == "admin" ? Role.Admin : Role.User;
                bool status = statusString?.ToLower() == "active";

                var updatedUser = new UserModel
                {
                    FirstName = firstName ?? "",
                    LastName = lastName ?? "",
                    Email = email,
                    PasswordHash = password, // <-- do NOT use ?? "" here, keep it null if not set
                    Role = role,
                    Status = status
                };

                var result = await _authService.UpdateUserAsync(email, updatedUser);
                return result
                    ? Ok(new { message = "User updated successfully" })
                    : NotFound(new { error = "User not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating user: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }

    }

    public class LoginRequest
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}

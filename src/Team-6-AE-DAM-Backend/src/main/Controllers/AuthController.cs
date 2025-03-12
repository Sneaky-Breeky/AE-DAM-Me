using Microsoft.AspNetCore.Mvc;
using DAMBackend.auth;

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
            var result = await _authService.AuthenticateUserAsync(request.Email, request.Password);
            
            if (!result)
            {
                return Unauthorized(new { error = "Invalid email or password" }); // ✅ Return JSON
            }

            return Ok(new { message = "Login successful", role = "user" }); // ✅ Return JSON
        }
    }

    public class LoginRequest
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}

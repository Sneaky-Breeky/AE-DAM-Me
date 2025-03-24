using Microsoft.AspNetCore.Mvc;
using DAMBackend.auth;
using DAMBackend.Models;
using System.Text.Json;

namespace backend.auth
{
    [Route("api/{userId}/log")]
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

        [HttpGet("fetchLog")]
        public async Task<ActionResult<IEnumerable<LogImage>>> FetchUsers()
        {
            var result = await _authService.fetchLogAsync(userId);
            return Ok(result);
        }
        [HttpPost("addLog")]
                public async Task<IActionResult> AddLog([FromBody] JsonElement jsonLog)
                {
                    try
                    {
                        int imageId = jsonLog.GetProperty("imageId").GetInt();
                        int userId = jsonLog.GetProperty("userId").GetInt();
                        string userType = jsonLog.GetProperty("userType").GetString();
                        string typeOfLog = jsonLog.GetProperty("typeOfLog").GetString();
                        DateTime date = jsonLog.GetProperty("date"),GetDate();


                        var log = new LogImage
                        {
                            ImageId = imageId;
                            UserId = userId;
                            UserType = userType;
                            TypeOfLog = typeOfLog;
                            Date = date;
                        };

                        var result = await _authService.AddLogAsync(log);

                        return result
                            ? Ok(new { message = "Log added successfully" })
                            : BadRequest(new { error = "Log already exists" });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Error adding log: {ex.Message}");
                        return BadRequest(new { error = "Invalid log data format" });
                    }
                }
            }
}

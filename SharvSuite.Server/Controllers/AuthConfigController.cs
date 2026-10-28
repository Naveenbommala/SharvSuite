using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SharvSuite.Server.Configuration;

namespace SharvSuite.Server.Controllers;

[ApiController]
[Route("api/auth/config")]
public sealed class AuthConfigController : ControllerBase
{
    private readonly FirebaseOptions _firebaseOptions;
    private readonly GoogleCalendarOptions _googleCalendarOptions;

    public AuthConfigController(
        IOptions<FirebaseOptions> firebaseOptions,
        IOptions<GoogleCalendarOptions> googleCalendarOptions)
    {
        _firebaseOptions = firebaseOptions.Value;
        _googleCalendarOptions = googleCalendarOptions.Value;
    }

    [HttpGet]
    public IActionResult Get()
    {
        if (string.IsNullOrWhiteSpace(_firebaseOptions.ApiKey) ||
            string.IsNullOrWhiteSpace(_googleCalendarOptions.ClientId))
        {
            return Problem(
                detail: "Authentication settings are missing in appsettings.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        return Ok(new
        {
            Firebase = new
            {
                _firebaseOptions.ApiKey,
                _firebaseOptions.AuthDomain,
                _firebaseOptions.ProjectId,
                _firebaseOptions.StorageBucket,
                _firebaseOptions.MessagingSenderId,
                _firebaseOptions.AppId
            },
            GoogleCalendar = new
            {
                _googleCalendarOptions.ClientId
            }
        });
    }
}

using System.Security.Claims;
using GjirafaNewsAPI.Models;
using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GjirafaNewsAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    // [Authorize]
    public class UsersController(IUserService userService) : ControllerBase
    {
        [HttpGet("me")]
        public ActionResult<ApiResponse<CurrentUserResponse>> Me()
        {
            var userId = User.FindFirst("sub")?.Value ?? string.Empty;
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                        ?? User.FindFirst("email")?.Value
                        ?? string.Empty;
            var name = User.FindFirst("name")?.Value
                       ?? User.FindFirst("preferred_username")?.Value
                       ?? email;
            var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

            return Ok(ApiResponse<CurrentUserResponse>.Ok(
                new CurrentUserResponse(userId, email, name, roles)));
        }

        [HttpGet]
        // [Authorize(Policy = "AdminOnly")]
        public ActionResult<ApiResponse<IEnumerable<UserResponse>>> GetAll() =>
            Ok(ApiResponse<IEnumerable<UserResponse>>.Ok(userService.GetAll()));

        [HttpGet("{id:guid}")]
        // [Authorize(Policy = "AdminOnly")]
        public ActionResult<ApiResponse<UserResponse>> GetById(Guid id) =>
            Ok(ApiResponse<UserResponse>.Ok(userService.GetById(id)));

        [HttpPost]
        // [Authorize(Policy = "AdminOnly")]
        public ActionResult<ApiResponse<UserResponse>> Create([FromBody] CreateUserRequest request)
        {
            var created = userService.Create(request);
            var body = ApiResponse<UserResponse>.Ok(created, "User created");
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, body);
        }

        [HttpPut("{id:guid}")]
        // [Authorize(Policy = "AdminOnly")]
        public ActionResult<ApiResponse<UserResponse>> Update(Guid id, [FromBody] UpdateUserRequest request) =>
            Ok(ApiResponse<UserResponse>.Ok(userService.Update(id, request), "User updated"));

        [HttpDelete("{id:guid}")]
        // [Authorize(Policy = "AdminOnly")]
        public ActionResult<ApiResponse<object?>> Delete(Guid id)
        {
            userService.Delete(id);
            return Ok(ApiResponse<object?>.Ok(null, "User deleted"));
        }
    }
}

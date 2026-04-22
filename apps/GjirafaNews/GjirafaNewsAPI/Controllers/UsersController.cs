using GjirafaNewsAPI.Models;
using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace GjirafaNewsAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UsersController(IUserService userService) : ControllerBase
    {
        [HttpGet]
        public ActionResult<ApiResponse<IEnumerable<UserResponse>>> GetAll() =>
            Ok(ApiResponse<IEnumerable<UserResponse>>.Ok(userService.GetAll()));

        [HttpGet("{id:guid}")]
        public ActionResult<ApiResponse<UserResponse>> GetById(Guid id) =>
            Ok(ApiResponse<UserResponse>.Ok(userService.GetById(id)));

        [HttpPost]
        public ActionResult<ApiResponse<UserResponse>> Create([FromBody] CreateUserRequest request)
        {
            var created = userService.Create(request);
            var body = ApiResponse<UserResponse>.Ok(created, "User created");
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, body);
        }

        [HttpPut("{id:guid}")]
        public ActionResult<ApiResponse<UserResponse>> Update(Guid id, [FromBody] UpdateUserRequest request) =>
            Ok(ApiResponse<UserResponse>.Ok(userService.Update(id, request), "User updated"));

        [HttpDelete("{id:guid}")]
        public ActionResult<ApiResponse<object?>> Delete(Guid id)
        {
            userService.Delete(id);
            return Ok(ApiResponse<object?>.Ok(null, "User deleted"));
        }
    }
}

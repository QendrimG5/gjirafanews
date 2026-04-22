using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Services
{
    public interface IUserService
    {
        IEnumerable<UserResponse> GetAll();
        UserResponse GetById(Guid id);
        UserResponse Create(CreateUserRequest request);
        UserResponse Update(Guid id, UpdateUserRequest request);
        void Delete(Guid id);
    }
}

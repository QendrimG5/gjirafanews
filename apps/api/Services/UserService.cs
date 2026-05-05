using System.ComponentModel.DataAnnotations;
using GjirafaNewsAPI.Models;
using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Repositories;

namespace GjirafaNewsAPI.Services
{
    public class UserService(IUserRepository repository) : IUserService
    {
        public IEnumerable<UserResponse> GetAll() =>
            repository.GetAll().Select(ToResponse);

        public UserResponse GetById(Guid id)
        {
            var user = repository.GetById(id)
                ?? throw new KeyNotFoundException($"User {id} not found");
            return ToResponse(user);
        }

        public UserResponse Create(CreateUserRequest request)
        {
            if (repository.ExistsByEmail(request.Email))
            {
                throw new ValidationException($"Email '{request.Email}' is already in use");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Email = request.Email,
                CreatedAt = DateTime.UtcNow
            };

            return ToResponse(repository.Add(user));
        }

        public UserResponse Update(Guid id, UpdateUserRequest request)
        {
            var existing = repository.GetById(id)
                ?? throw new KeyNotFoundException($"User {id} not found");

            if (repository.ExistsByEmail(request.Email, id))
            {
                throw new ValidationException($"Email '{request.Email}' is already in use");
            }

            existing.Name = request.Name;
            existing.Email = request.Email;

            return ToResponse(repository.Update(existing)!);
        }

        public void Delete(Guid id)
        {
            if (!repository.Delete(id))
            {
                throw new KeyNotFoundException($"User {id} not found");
            }
        }

        private static UserResponse ToResponse(User user) =>
            new(user.Id, user.Name, user.Email, user.CreatedAt);
    }
}

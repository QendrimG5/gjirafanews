using GjirafaNewsAPI.Models;

namespace GjirafaNewsAPI.Repositories
{
    public interface IUserRepository
    {
        IEnumerable<User> GetAll();
        User? GetById(Guid id);
        User Add(User user);
        User? Update(User user);
        bool Delete(Guid id);
        bool ExistsByEmail(string email, Guid? excludeId = null);
    }
}

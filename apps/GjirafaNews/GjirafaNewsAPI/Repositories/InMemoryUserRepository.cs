using System.Collections.Concurrent;
using GjirafaNewsAPI.Models;

namespace GjirafaNewsAPI.Repositories
{
    public class InMemoryUserRepository : IUserRepository
    {
        private readonly ConcurrentDictionary<Guid, User> _users = new();

        public InMemoryUserRepository()
        {
            Seed();
        }

        private void Seed()
        {
            var now = DateTime.UtcNow;
            var seed = new[]
            {
                new User { Id = Guid.NewGuid(), Name = "Agon Krasniqi",  Email = "agon@gjirafa.com",   CreatedAt = now },
                new User { Id = Guid.NewGuid(), Name = "Blerta Hoxha",   Email = "blerta@gjirafa.com", CreatedAt = now },
                new User { Id = Guid.NewGuid(), Name = "Driton Berisha", Email = "driton@gjirafa.com", CreatedAt = now }
            };

            foreach (var user in seed)
            {
                _users[user.Id] = user;
            }
        }

        public IEnumerable<User> GetAll() => _users.Values.OrderBy(u => u.CreatedAt);

        public User? GetById(Guid id) => _users.TryGetValue(id, out var user) ? user : null;

        public User Add(User user)
        {
            _users[user.Id] = user;
            return user;
        }

        public User? Update(User user)
        {
            if (!_users.ContainsKey(user.Id)) return null;
            _users[user.Id] = user;
            return user;
        }

        public bool Delete(Guid id) => _users.TryRemove(id, out _);

        public bool ExistsByEmail(string email, Guid? excludeId = null) =>
            _users.Values.Any(u =>
                u.Email.Equals(email, StringComparison.OrdinalIgnoreCase)
                && (excludeId is null || u.Id != excludeId));
    }
}

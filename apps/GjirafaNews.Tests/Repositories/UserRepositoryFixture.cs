using GjirafaNewsAPI.Models;
using GjirafaNewsAPI.Repositories;
using Moq;

namespace GjirafaNews.Tests.Repositories;

public class UserRepositoryFixture
{
    public DateTime Now { get; } = new(2026, 5, 4, 12, 0, 0, DateTimeKind.Utc);

    public User Agon { get; }
    public User Blerta { get; }
    public User Driton { get; }

    public UserRepositoryFixture()
    {
        Agon = new User
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "Agon Krasniqi",
            Email = "Agon@Gjirafa.Com",
            CreatedAt = Now.AddMinutes(-30),
        };

        Blerta = new User
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name = "Blerta Hoxha",
            Email = "blerta@gjirafa.com",
            CreatedAt = Now.AddMinutes(-20),
        };

        Driton = new User
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Name = "Driton Berisha",
            Email = "driton@gjirafa.com",
            CreatedAt = Now.AddMinutes(-10),
        };
    }

    public IReadOnlyList<User> SeedUsers() => [Agon, Blerta, Driton];

    public InMemoryUserRepository CreateEmptyRepository()
    {
        var repo = new InMemoryUserRepository();
        foreach (var seeded in repo.GetAll().ToList())
        {
            repo.Delete(seeded.Id);
        }
        return repo;
    }

    public InMemoryUserRepository CreateRepositoryWithSeed()
    {
        var repo = CreateEmptyRepository();
        foreach (var user in SeedUsers())
        {
            repo.Add(user);
        }
        return repo;
    }

    public Mock<IUserRepository> CreateStrictMock(MockBehavior behavior = MockBehavior.Strict)
    {
        var mock = new Mock<IUserRepository>(behavior);
        mock.Setup(r => r.GetAll()).Returns(SeedUsers());
        mock.Setup(r => r.GetById(Agon.Id)).Returns(Agon);
        mock.Setup(r => r.GetById(Blerta.Id)).Returns(Blerta);
        mock.Setup(r => r.GetById(Driton.Id)).Returns(Driton);
        mock.Setup(r => r.GetById(It.Is<Guid>(g =>
                g != Agon.Id && g != Blerta.Id && g != Driton.Id)))
            .Returns((User?)null);
        mock.Setup(r => r.ExistsByEmail(It.IsAny<string>(), It.IsAny<Guid?>()))
            .Returns((string email, Guid? excludeId) =>
                SeedUsers().Any(u =>
                    u.Email.Equals(email, StringComparison.OrdinalIgnoreCase)
                    && (excludeId is null || u.Id != excludeId)));
        return mock;
    }

    public User NewUser(string name = "Test User", string email = "test@gjirafa.com") => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Email = email,
        CreatedAt = Now,
    };
}

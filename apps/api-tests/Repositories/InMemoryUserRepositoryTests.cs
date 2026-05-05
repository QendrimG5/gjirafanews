using GjirafaNews.Tests.Infrastructure;
using GjirafaNewsAPI.Models;
using GjirafaNewsAPI.Repositories;
using Moq;

namespace GjirafaNews.Tests.Repositories;

[Collection(PostgresCollection.Name)]
public class InMemoryUserRepositoryTests(UserRepositoryFixture fixture, PostgresCollectionFixture postgres)
    : IClassFixture<UserRepositoryFixture>
{
    [Fact]
    public void GetAll_ReturnsSeededUsers_OrderedByCreatedAt()
    {
        var sut = fixture.CreateRepositoryWithSeed();

        var result = sut.GetAll().ToList();

        Assert.Equal(3, result.Count);
        Assert.Equal(fixture.Agon.Id, result[0].Id);
        Assert.Equal(fixture.Blerta.Id, result[1].Id);
        Assert.Equal(fixture.Driton.Id, result[2].Id);
    }

    [Fact]
    public void GetAll_OnEmptyRepository_ReturnsNoUsers()
    {
        var sut = fixture.CreateEmptyRepository();

        Assert.Empty(sut.GetAll());
    }

    [Fact]
    public void GetById_ReturnsUser_WhenIdExists()
    {
        var sut = fixture.CreateRepositoryWithSeed();

        var result = sut.GetById(fixture.Blerta.Id);

        Assert.NotNull(result);
        Assert.Equal(fixture.Blerta.Email, result!.Email);
    }

    [Fact]
    public void GetById_ReturnsNull_WhenIdMissing()
    {
        var sut = fixture.CreateRepositoryWithSeed();

        var result = sut.GetById(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public void Add_PersistsUser_AndReturnsSameInstance()
    {
        var sut = fixture.CreateEmptyRepository();
        var user = fixture.NewUser(name: "New One", email: "new@gjirafa.com");

        var added = sut.Add(user);

        Assert.Same(user, added);
        Assert.Equal(user, sut.GetById(user.Id));
    }

    [Fact]
    public void Add_WithExistingId_OverwritesPreviousEntry()
    {
        var sut = fixture.CreateRepositoryWithSeed();
        var replacement = new User
        {
            Id = fixture.Agon.Id,
            Name = "Renamed",
            Email = "renamed@gjirafa.com",
            CreatedAt = fixture.Now,
        };

        sut.Add(replacement);

        var stored = sut.GetById(fixture.Agon.Id);
        Assert.NotNull(stored);
        Assert.Equal("Renamed", stored!.Name);
        Assert.Equal("renamed@gjirafa.com", stored.Email);
    }

    [Fact]
    public void Update_ReturnsUpdatedUser_WhenIdExists()
    {
        var sut = fixture.CreateRepositoryWithSeed();
        var modified = new User
        {
            Id = fixture.Driton.Id,
            Name = "Driton B.",
            Email = "driton.b@gjirafa.com",
            CreatedAt = fixture.Driton.CreatedAt,
        };

        var result = sut.Update(modified);

        Assert.NotNull(result);
        Assert.Equal("Driton B.", result!.Name);
        Assert.Equal("driton.b@gjirafa.com", sut.GetById(fixture.Driton.Id)!.Email);
    }

    [Fact]
    public void Update_ReturnsNull_WhenIdMissing()
    {
        var sut = fixture.CreateRepositoryWithSeed();
        var ghost = fixture.NewUser();

        Assert.Null(sut.Update(ghost));
        Assert.Null(sut.GetById(ghost.Id));
    }

    [Fact]
    public void Delete_RemovesUser_AndReturnsTrue()
    {
        var sut = fixture.CreateRepositoryWithSeed();

        var removed = sut.Delete(fixture.Agon.Id);

        Assert.True(removed);
        Assert.Null(sut.GetById(fixture.Agon.Id));
        Assert.Equal(2, sut.GetAll().Count());
    }

    [Fact]
    public void Delete_ReturnsFalse_WhenIdMissing()
    {
        var sut = fixture.CreateRepositoryWithSeed();

        Assert.False(sut.Delete(Guid.NewGuid()));
        Assert.Equal(3, sut.GetAll().Count());
    }

    [Theory]
    [InlineData("agon@gjirafa.com")]
    [InlineData("AGON@GJIRAFA.COM")]
    [InlineData("Agon@Gjirafa.Com")]
    public void ExistsByEmail_IsCaseInsensitive(string email)
    {
        var sut = fixture.CreateRepositoryWithSeed();

        Assert.True(sut.ExistsByEmail(email));
    }

    [Fact]
    public void ExistsByEmail_ReturnsFalse_WhenEmailUnknown()
    {
        var sut = fixture.CreateRepositoryWithSeed();

        Assert.False(sut.ExistsByEmail("nobody@gjirafa.com"));
    }

    [Fact]
    public void ExistsByEmail_ExcludesProvidedId()
    {
        var sut = fixture.CreateRepositoryWithSeed();

        Assert.False(sut.ExistsByEmail(fixture.Blerta.Email, excludeId: fixture.Blerta.Id));
        Assert.True(sut.ExistsByEmail(fixture.Blerta.Email, excludeId: fixture.Driton.Id));
    }

    [Fact]
    public void Mock_GetById_HonoursFixtureSeedSetup()
    {
        var mock = fixture.CreateStrictMock();

        var hit = mock.Object.GetById(fixture.Agon.Id);
        var miss = mock.Object.GetById(Guid.NewGuid());

        Assert.Same(fixture.Agon, hit);
        Assert.Null(miss);
        mock.Verify(r => r.GetById(It.IsAny<Guid>()), Times.Exactly(2));
    }

    [Fact]
    public void Mock_ExistsByEmail_RespectsExcludeId()
    {
        var mock = fixture.CreateStrictMock();

        Assert.True(mock.Object.ExistsByEmail("blerta@gjirafa.com"));
        Assert.False(mock.Object.ExistsByEmail("blerta@gjirafa.com", fixture.Blerta.Id));
        mock.Verify(r => r.ExistsByEmail("blerta@gjirafa.com", null), Times.Once);
        mock.Verify(r => r.ExistsByEmail("blerta@gjirafa.com", fixture.Blerta.Id), Times.Once);
    }

    [Fact]
    public async Task PostgresFixture_RoundTripsDomainUser()
    {
        await postgres.ResetAsync();
        await using var db = postgres.CreateContext();

        var user = new GjirafaNewsAPI.Domain.Entities.User
        {
            Id = Guid.NewGuid(),
            Name = "PG User",
            Email = "pg@gjirafa.com",
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var stored = await db.Users.FindAsync(user.Id);

        Assert.NotNull(stored);
        Assert.Equal("pg@gjirafa.com", stored!.Email);
    }
}

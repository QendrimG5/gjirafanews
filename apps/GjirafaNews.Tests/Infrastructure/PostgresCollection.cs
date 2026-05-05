namespace GjirafaNews.Tests.Infrastructure;

[CollectionDefinition(Name)]
public class PostgresCollection : ICollectionFixture<PostgresCollectionFixture>
{
    public const string Name = "PostgreSQL";
}

using Backend.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;


public class MongoDbContext
{
    private readonly IMongoDatabase _database;
    
    static MongoDbContext()
    {
        BsonSerializer.RegisterSerializer(
            new GuidSerializer(GuidRepresentation.Standard)
        );
    }

    public MongoDbContext(IConfiguration configuration)
    {
        var client = new MongoClient(
            configuration.GetConnectionString("JolibiMongoDB")
        );

        _database = client.GetDatabase("JoliDb");
    }
    
    public IMongoCollection<Review> Reviews => _database.GetCollection<Review>("reviews");
}
using System.Text.Json;
using MySqlConnector;

var root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../"));
var settingsPath = Path.Combine(root, "src", "SV5T.Api", "appsettings.Development.json");
using var settings = JsonDocument.Parse(await File.ReadAllTextAsync(settingsPath));
var connectionString = settings.RootElement
    .GetProperty("ConnectionStrings")
    .GetProperty("DefaultConnection")
    .GetString() ?? throw new InvalidOperationException("Missing connection string.");

await using var connection = new MySqlConnection(connectionString);
await connection.OpenAsync();
await using var command = connection.CreateCommand();
command.CommandText = """
    SELECT Name, Status, Level, AwardType, RegOpenAt, RegCloseAt, UTC_TIMESTAMP() AS NowUtc
    FROM campaigns
    WHERE LOWER(Name) LIKE '%demo%'
    ORDER BY RegCloseAt ASC;
    """;

await using var reader = await command.ExecuteReaderAsync();
while (await reader.ReadAsync())
{
    Console.WriteLine(
        "Name={0}; Status={1}; Level={2}; AwardType={3}; RegOpenAt={4:O}; RegCloseAt={5:O}; NowUtc={6:O}",
        reader.GetString(0),
        reader.GetValue(1),
        reader.GetValue(2),
        reader.GetValue(3),
        reader.GetDateTime(4),
        reader.GetDateTime(5),
        reader.GetDateTime(6));
}

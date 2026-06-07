#:package MySqlConnector@2.3.7
using MySqlConnector;

var cs = "Server=127.0.0.1;Port=3307;Database=DBjolibi;User ID=root;Password=19082173;AllowUserVariables=true;GuidFormat=None";
var sql = args.Length > 0 ? string.Join(" ", args) : Console.In.ReadToEnd();

await using var conn = new MySqlConnection(cs);
await conn.OpenAsync();

foreach (var stmt in sql.Split(";;"))
{
    var s = stmt.Trim();
    if (s.Length == 0) continue;
    await using var cmd = new MySqlCommand(s, conn);
    var isSelect = s.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase)
                || s.TrimStart().StartsWith("SHOW", StringComparison.OrdinalIgnoreCase);
    if (isSelect)
    {
        await using var r = await cmd.ExecuteReaderAsync();
        var cols = new string[r.FieldCount];
        for (int i = 0; i < r.FieldCount; i++) cols[i] = r.GetName(i);
        Console.WriteLine(string.Join("\t", cols));
        int n = 0;
        while (await r.ReadAsync())
        {
            var vals = new string[r.FieldCount];
            for (int i = 0; i < r.FieldCount; i++)
                vals[i] = r.IsDBNull(i) ? "NULL" : r.GetValue(i)?.ToString() ?? "";
            Console.WriteLine(string.Join("\t", vals));
            n++;
        }
        Console.WriteLine($"-- {n} row(s)");
    }
    else
    {
        var affected = await cmd.ExecuteNonQueryAsync();
        Console.WriteLine($"-- OK, {affected} row(s) affected");
    }
}

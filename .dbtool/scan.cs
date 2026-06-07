#:package MySqlConnector@2.3.7
using MySqlConnector;

var cs = "Server=127.0.0.1;Port=3307;Database=DBjolibi;User ID=root;Password=19082173;GuidFormat=None";
await using var conn = new MySqlConnection(cs);
await conn.OpenAsync();

// 1. Find all CHAR(36) columns
var cols = new List<(string t, string c)>();
await using (var cmd = new MySqlCommand(
    @"SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND DATA_TYPE='char' AND CHARACTER_MAXIMUM_LENGTH=36
      ORDER BY TABLE_NAME, COLUMN_NAME", conn))
await using (var r = await cmd.ExecuteReaderAsync())
    while (await r.ReadAsync()) cols.Add((r.GetString(0), r.GetString(1)));

// 2. For each, find distinct invalid-guid values
var invalidPrefixes = new SortedSet<string>();
foreach (var (t, c) in cols)
{
    var bad = new List<string>();
    await using var cmd = new MySqlCommand($"SELECT DISTINCT `{c}` FROM `{t}` WHERE `{c}` IS NOT NULL", conn);
    await using var r = await cmd.ExecuteReaderAsync();
    while (await r.ReadAsync())
    {
        var v = r.GetString(0);
        if (!Guid.TryParse(v, out _)) bad.Add(v);
    }
    if (bad.Count > 0)
    {
        Console.WriteLine($"[{t}.{c}]  {bad.Count} invalid distinct value(s)");
        foreach (var v in bad.Take(4)) Console.WriteLine($"    {v}");
        if (bad.Count > 4) Console.WriteLine($"    ... (+{bad.Count - 4} more)");
        foreach (var v in bad) { var p = v.Length >= 8 ? v.Substring(0, 8) : v; invalidPrefixes.Add(p); }
    }
}
Console.WriteLine("\n=== distinct invalid 8-char prefixes ===");
foreach (var p in invalidPrefixes) Console.WriteLine("  " + p);

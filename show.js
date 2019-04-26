let sqlite3 = require("sqlite3");
let db = new sqlite3.Database('words.db', (err) => {
    if (err)
        console.error(err.message);
    console.log('Connected to SQLite Database.');
});
db.all("SELECT * FROM words", [], function (err, rows) {
    rows.forEach(function (row) {
        console.log(row.word);
    });
    console.log("Word count: "+rows.length);
});
db.close();
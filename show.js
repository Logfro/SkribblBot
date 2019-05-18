let sqlite3 = require("sqlite3");
let db = new sqlite3.Database('words_de.db', (err) => {
    if (err)
        console.error(err.message);
    console.log('Connected to SQLite Database German.');
});
let db2 = new sqlite3.Database('words_en.db', (err) => {
    if (err)
        console.error(err.message);
    console.log('Connected to SQLite Database English.');
});
db.all("SELECT * FROM words", [], function (err, rows) {
    console.log("German Word count: "+rows.length);
});
db2.all("SELECT * FROM words", [], function (err, rows) {
    console.log("German Word count: "+rows.length);
});
db.close();
db2.close();
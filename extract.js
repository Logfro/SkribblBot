let sqlite3 = require("sqlite3");
let fs = require("fs");
let db = new sqlite3.Database('words_en.db', (err) => {
    if (err)
        console.error(err.message);
    console.log('Connected to SQLite Database English.');
});
db.all("SELECT * FROM words", [], function (err, rows) {
    console.log("English Word count: "+rows.length);
    fs.writeFile('words_english.json', JSON.stringify(rows,null,4),function(){});
});
db.close();
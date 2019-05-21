let file = JSON.parse(require("fs").readFileSync("words_english.json"));
let params = {laenge: 11, maske: "__________r"};
console.log("---------------------------------");
file.forEach(function (word) {
    if (word.word.length === params.laenge)
        if (checkMask(word.word))
            console.log(word.word);
});

function checkMask(word) {
    let ret = true;
    for (let i = 0; i < params.maske.length; i++)
        if (params.maske.charAt(i) !== "_")
            if (params.maske[i] !== word[i])
                ret = false;
    return ret;
}
console.log(JSON.stringify(file));
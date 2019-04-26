let file = JSON.parse(require("fs").readFileSync("words.json"));

let params = {laenge: 6, maske: "______"};

file.forEach(function (word) {
    if (word.word.length === params.laenge)
        console.log(word);
});
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
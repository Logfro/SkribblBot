const puppeteer = require("puppeteer");
const cluster = require("cluster");
const sqlite3 = require("sqlite3");

if (cluster.isMaster) {
    let db = new sqlite3.Database('words.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to SQLite Database.');
    });

    let que = [];

    function addQue(content) {
        for (let i = 0; i < content.length; i++) {
            que.push(content[i]);
        }
    }

    async function processQue() {
        if (que[0] !== "" && que[0] !== undefined) {
            writeWord(que[0]);
            que.splice(0, 1);
        }
        setTimeout(function () {
            processQue();
        }, 250);
    }

    processQue();

    function writeWord(word) {
        db.all("SELECT * FROM words", [], function () {
            db.run("INSERT INTO words VALUES (?)", [word], function (err) {
                if (err) {
                    //console.log("Couldnt add " + word);
                } else {
                    console.log("Added Word: " + word);
                }
            });
        });
    }


    function messageHandler(worker, message) {
        if (message.cmd === "setWord") {
            addQue(message.content);
        }
    }

    cluster.fork();
    cluster.fork();
    cluster.fork();
    cluster.fork();

    cluster.on("message", messageHandler);

    cluster.on('exit', function () {
        cluster.fork();
    });
} else if (cluster.isWorker) {
    const USERNAME_SELECTOR = "#inputName";
    const LANGUAGE_SELECTOR = "#loginLanguage";
    const LANGUAGE = "German";
    const START_ROOM = "buttonLoginCreatePrivate";
    const ROUND_CNT = "#lobbySetRounds";
    const INVITE_LINK = "invite";
    const START_GAME = "formLogin";
    const CHAT = "#inputChat";
    const BROWSER_CONF = {headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']};

    let slaveReady = false;
    let masterPage;
    let masterBrowser;
    let slavePage;
    let slaveBrowser;
    let inviteLink;
    let swap = false;
    let id = 0;
    let oldWord;
    let firstrun = true;
    let stopGameVar = false;

    async function startSlave(result) {
        inviteLink = result;
        slaveBrowser = await puppeteer.launch(BROWSER_CONF);
        slavePage = await slaveBrowser.pages();
        slavePage = slavePage[0];
        await slavePage.goto(result);
        await slavePage.click(USERNAME_SELECTOR);
        await slavePage.keyboard.type("Bot_Slave");
        await slavePage.select(LANGUAGE_SELECTOR, LANGUAGE);
        let waitTill = new Date(new Date().getTime() + 1.5 * 1000);
        while (waitTill > new Date()) {
        }
        await slavePage.evaluate(function (START_GAME) {
            let form = document.getElementById(START_GAME);
            let btn = form.children[form.children.length - 1];
            btn.click();
        }, START_GAME);
        await slavePage.waitFor(1000);
    }

    async function main() {
        masterBrowser = await puppeteer.launch(BROWSER_CONF);
        masterPage = await masterBrowser.pages();
        masterPage = masterPage[0];
        await masterPage.goto("https://skribbl.io/");
        await masterPage.click(USERNAME_SELECTOR);
        await masterPage.keyboard.type("Bot_Master");
        await masterPage.select(LANGUAGE_SELECTOR, LANGUAGE);
        let waitTill = new Date(new Date().getTime() + 1.5 * 1000);
        while (waitTill > new Date()) {
        }
        await masterPage.evaluate(function (START_ROOM) {
            document.getElementById(START_ROOM).click();
        }, START_ROOM);
        await masterPage.waitFor(1000);
        await masterPage.evaluate(function (INVITE_LINK) {
            return document.getElementById(INVITE_LINK).value;
        }, INVITE_LINK).then(function (result) {
            startSlave(result).then(function () {
                slaveReady = true;
            })
        });
        await masterPage.select(ROUND_CNT, "10");
        await startGame();
    }

    async function handleWord(result) {
        saveWords([result]);
        let page;
        if (swap) {
            page = slavePage;
            swap = false;
        } else {
            page = masterPage;
            swap = true;
        }
        await page.waitFor(1200);
        await page.click(CHAT);
        await page.keyboard.type(result);
        await page.keyboard.press("Enter");
        await page.waitFor(4000);
    }

    function saveWords(words) {
        process.send({cmd: "setWord", content: words});
    }

    async function wordSelector() {
        id++;
        console.log("JOB ID: " + id);
        let page;
        let word = "";
        if (swap) {
            page = masterPage;
        } else {
            page = slavePage;
        }
        await page.waitFor(2000);
        await page.evaluate(function () {
            return document.getElementById("screenGame").style.display === "none";
        }).then(function (result) {
            stopGameVar = result
        });
        if (stopGameVar)
            return;
        if (!firstrun)
            await page.waitForFunction("document.getElementsByClassName('word').length === 3 && document.getElementsByClassName('word')[1] === \"" + oldWord + "\"");
        else
            await page.waitForFunction("document.getElementsByClassName('word').length === 3");
        await page.evaluate(function () {
            let wordsArr = [];
            wordsArr[0] = document.getElementsByClassName("word")[0].innerText;
            wordsArr[1] = document.getElementsByClassName("word")[1].innerText;
            wordsArr[2] = document.getElementsByClassName("word")[2].innerText;
            document.getElementsByClassName("word")[1].click();
            return wordsArr;
        }).then(function (result) {
            saveWords(result);
            word = result[1];
        });
        await handleWord(word);
        //console.log("Handled Word: " + word);
        oldWord = word;
        await wordSelector();
    }

    async function startGame() {
        if (slaveReady === false) {
            setTimeout(startGame, 1000);
            return;
        }
        await masterPage.evaluate(function () {
            document.getElementById("buttonLobbyPlay").click();
        });
        console.log("Started Game with Invite Link: " + inviteLink);
        await wordSelector();
        id = 0;
        await startGame();
    }

    process.on('unhandledRejection', function () {
        process.exit();
    });

    main();
}

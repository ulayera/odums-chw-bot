var exports = module.exports = {};
const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
var envService = require("./env-service.js");
const dataService = require("./data-service.js");
const token = envService.getEnv('TELEGRAM_BOT_TOKEN');
const bot = new TelegramBot(token, {polling: true});
const utilService = require("./util-service.js");
const scrapperLogic = require("../logic/scrapper-logic.js");
const sensitive = {
    "forum": {
        "vb_login_md5password": envService.getEnv('FORUM_MD5PASS'),
        "vb_login_md5password_utf": envService.getEnv('FORUM_MD5PASS'),
        "s": envService.getEnv('FORUM_S'),
        "vb_login_username": envService.getEnv('FORUM_USER')
    }
};
let login_post_data = `do=login&vb_login_md5password=${sensitive.forum.vb_login_md5password}&vb_login_md5password_utf=${sensitive.forum.vb_login_md5password_utf}&` +
    `s=${sensitive.forum.s}&securitytoken=guest&url=%2Fforo%2Fforumdisplay.php%3Ff%3D168&vb_login_username=${sensitive.forum.vb_login_username}&vb_login_password=&cookieuser=1`;
let currentVersion = {
    "number": envService.getEnv('VERSION'),
    "text": envService.getEnv('NEW_VERSION_MESSAGE_' + envService.getEnv('VERSION'))
};


exports.headers = null;

exports.doLogin = function (cb, login) {
    let data = "";
    if (login)
        data = `do=login&vb_login_md5password=${login.pass}&vb_login_md5password_utf=${login.pass}&` +
            `s=${sensitive.forum.s}&securitytoken=guest&url=%2Fforo%2Fforumdisplay.php%3Ff%3D168&vb_login_username=${login.user}&vb_login_password=&cookieuser=1`;
    var post_options = {
        host: 'www.chw.net',
        port: '80',
        path: '/foro/login.php?do=login',
        method: 'POST',
        headers: {
            "accept-language": "en",
            "Content-Length": Buffer.byteLength((data) ? data : login_post_data),
            "upgrade-insecure-requests": "1",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3221.0 Safari/537.36",
            "content-type": "application/x-www-form-urlencoded",
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "cache-control": "no-cache"
        }
    };

    var post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        let resData = '';
        res.on('data', function (chunk) {
            resData += chunk;
        }).on('end', function () {
            for (let i = 0; i < res.headers["set-cookie"].length; i++)
                if (res.headers["set-cookie"][i].indexOf("vb_password") > -1) {
                    exports.headers = res.headers;
                    cb(res.headers);
                }
            cb(false);
        });
    });
    post_req.on('error', function (err) {
        if (err) {
            console.error(err);
            cb(false);
        }
    });
    post_req.write((data) ? data : login_post_data);
    post_req.end();
};

exports.getPapas = function (cb, headers) {
    var strCookies = "";
    let useHeaders;
    if (headers) {
        useHeaders = headers;
    } else {
        useHeaders = exports.headers;
    }
    for (var i = 0; i < useHeaders["set-cookie"].length; i++)
        strCookies += useHeaders["set-cookie"][i] + "; ";
    let path = '/foro/papa/?pp=10&daysprune=-1&sort=dateline&prefixid=&order=desc';
    var options = {
        host: 'www.chw.net',
        port: '80',
        path: path,
        method: 'GET',
        headers: {
            "accept-language": "en",
            "upgrade-insecure-requests": "1",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3221.0 Safari/537.36",
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "cookie": strCookies,
            "connection": "keep-alive"
        }
    };
    var req = http.get(options, function (res) {
        var bodyChunks = [];
        res.on('data', function (chunk) {
            bodyChunks.push(chunk);
        }).on('end', function () {
            cb(Buffer.concat(bodyChunks).toString('latin1'));
        });
    });
    req.on('error', function (e) {
        console.error(e);
        cb(e);
    });
};

exports.getPapaDetails = function (cb, obj) {
    var urlObj = utilService.splitUrl(obj.url);
    var strCookies = "";
    for (var i = 0; i < exports.headers["set-cookie"].length; i++)
        strCookies += exports.headers["set-cookie"][i] + "; ";
    var options = {
        host: urlObj.hostname,
        port: '80',
        path: urlObj.pathname,
        method: 'GET',
        headers: {
            "accept-language": "en",
            "upgrade-insecure-requests": "1",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3221.0 Safari/537.36",
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "cookie": strCookies,
            "connection": "keep-alive"
        }
    };
    var req = http.get(options, function (res) {
        var bodyChunks = [];
        //res.setEncoding('utf8');
        res.on('data', function (chunk) {
            bodyChunks.push(chunk);
        }).on('end', function () {
            var body = Buffer.concat(bodyChunks).toString('latin1');
            obj.post = utilService.parseaHTMLPapaDetails(body);
            if (cb)
                cb(obj);
        });
    });
    req.on('error', function (e) {
        console.log('ERROR: ' + e.message);
    });
};

async function help(chatId) {
    await bot.sendMessage(chatId, "Escribe '/login {user} {pass}' para registrarte. (tu password no se almacenará, pero tu sesión durará una semana)");
    await bot.sendMessage(chatId, "Escribe '/remember {user} {pass}' para registrarte. (tu password se almacenará, pero codificada");
    await bot.sendMessage(chatId, "Escribe '/logout' para dejar de recibir mensajes.");
    await bot.sendMessage(chatId, "Escribe '/help para mostrar esta ayuda.");
}

bot.onText(/\/start/, async (msg) => {
    help(msg.chat.id);
});

bot.onText(/\/help/, (msg) => {
    help(msg.chat.id);
});


async function saveRecipient(chatId, user, pass, msg) {
    await dataService.saveRecipient(async function () {
        await bot.sendMessage(chatId, msg);
    }, {
        "_id": chatId,
        "chatId": chatId,
        "username": user,
        "password": pass,
        "date": new Date()
    });
}

bot.onText(/\/login (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (await scrapperLogic.checkIfAllowed(match[1], match[2])) {
        saveRecipient(chatId, match[1], null, `Bienvenido ${match[1]}! Tu login fué exitoso! tu pass no fue almacenada, por lo que tendras que loguearte semanalmente.`);
    } else {
        await bot.sendMessage(chatId, "Tu login falló por uno de los sgtes. motivos:\n- Ese usuario no esta registrado en CHW.\n- Tu password es incorrecta\n- No calificas para ver las papas.");
    }
});

bot.onText(/\/remember (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (await scrapperLogic.checkIfAllowed(match[1], match[2])) {
        saveRecipient(chatId, match[1], await scrapperLogic.passToMd5(match[2]), `Bienvenido ${match[1]}! Tu login fué exitoso! tu pass fue (codificada y) almacenada, por lo que se renovará automáticamente.`);
    } else {
        await bot.sendMessage(chatId, "Tu login falló por uno de los sgtes. motivos:\n- Ese usuario no esta registrado en CHW.\n- Tu password es incorrecta\n- No calificas para ver las papas.");
    }
});

bot.onText(/\/logout/, async (msg) => {
    const chatId = msg.chat.id;
    var result = await dataService.deleteRecipient(async function (data) {
        await bot.sendMessage(chatId, "Te deslogueaste OK, si almacenaste tu password esta ya se eliminó completamente de la BD");
    }, {"_id": chatId});
});

exports.sendTelegramMessage = async function (cb, obj) {
    let body = obj.titulo +
        "\n\nURL Web Foro: " + obj.url +
        "\n\nURL Tapatalk:\nhttps://r.tapatalk.com/shareLink?share_fid=16103&share_tid=1539386&url=" + encodeURI(obj.url) + "&share_type=t" +
        "\n\nURL Tapatalk Prueba:\n​\ntapatalk://www.chw.net/foro?location=topic&type=vb40_5.0.1&fid=16103&tid=" + obj._id;
    dataService.findAllRecipients(async function (recipients) {
        for (let i = 0; i < recipients.length; i++) {
            let recipient = recipients[i];
            let chatId = recipient.chatId;
            let isAllowed = true;
            if (utilService.dateDiff(recipient.date, Date()) > 6)
                if (recipient.password) {
                    isAllowed = await scrapperLogic.checkIfAllowed(recipient.username, recipient.password);
                    await saveRecipient(chatId, recipient.username, await scrapperLogic.passToMd5(recipient.password), "Tu acceso se renovó automáticamente!");
                }
            if (isAllowed) {
                await bot.sendMessage(chatId, body);
            } else {
                await bot.sendMessage(chatId, "Se venció tu acceso a las papas, prueba con:\n- Loguearte nuevamente con /login o /remember\n- Deslogueate con /logout.");
            }
        }
        cb(obj);
    });
};
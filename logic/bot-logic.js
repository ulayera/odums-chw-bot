var exports = module.exports = {};

const envService = module.parent.exports.envService;
const utilService = module.parent.exports.utilService;
const dataService = module.parent.exports.dataService;
const httpService = module.parent.exports.httpService;
const vBulletin = module.parent.exports.vBulletin;
const TelegramBot = require('node-telegram-bot-api');
const token = envService.getEnv('TELEGRAM_BOT_TOKEN');
const bot = new TelegramBot(token, {polling: true});

async function help(chatId) {
    await bot.sendMessage(chatId, "Escribe '/login {user} {pass}' para registrarte. (tu password no se almacenará, pero tu sesión durará una semana)", {disable_web_page_preview: true});
    await bot.sendMessage(chatId, "Escribe '/remember {user} {pass}' para registrarte. (tu password se almacenará, pero codificada", {disable_web_page_preview: true});
    await bot.sendMessage(chatId, "Escribe '/logout' para dejar de recibir mensajes.", {disable_web_page_preview: true});
    await bot.sendMessage(chatId, "Escribe '/help para mostrar esta ayuda.", {disable_web_page_preview: true});
}

async function saveRecipient(chatId, user, pass, msg) {
    await dataService.saveRecipient(async function () {
        await bot.sendMessage(chatId, msg, {disable_web_page_preview: true});
    }, {
        "_id": chatId,
        "chatId": chatId,
        "username": user,
        "password": pass,
        "date": new Date()
    });
}

let getLoginHeaders = exports.getLoginHeaders = async function getLoginHeaders(user, pass) {
    return await utilService.asyncWrapper(httpService.doLogin, [{
        user: user,
        pass: pass
    }]);
};

let checkIfAllowed = exports.checkIfAllowed = async function checkIfAllowed(user, pass, headers) {
    let loginHeaders;
    if (!headers) {
        loginHeaders = await utilService.asyncWrapper(httpService.doLogin, [{
            user: user,
            pass: pass
        }]);
    } else {
        loginHeaders = headers;
    }
    if (loginHeaders && loginHeaders["set-cookie"].length > 3) {
        let a = await utilService.asyncWrapper(httpService.getPapas, [loginHeaders]);
        b = utilService.parseaHTMLPapas(a);
        return b && b.length > -1;
    } else
        return false;
};

let checkIfOdumAllowed = exports.checkIfOdumAllowed = async function checkIfOdumAllowed(user, pass, headers) {
    let loginHeaders;
    if (!headers) {
        loginHeaders = await utilService.asyncWrapper(httpService.doLogin, [{
            user: user,
            pass: pass
        }]);
    } else {
        loginHeaders = headers;
    }
    if (loginHeaders && loginHeaders["set-cookie"].length > 3) {
        let a = await utilService.asyncWrapper(httpService.getOdums, [loginHeaders]);
        b = utilService.parseaHTMLPapas(a);
        return b && b.length > 0;
    } else
        return false;
};

bot.onText(/\/start/, async (msg) => {
    help(msg.chat.id);
});

bot.onText(/\/help/, (msg) => {
    help(msg.chat.id);
});

bot.onText(/\/login (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (await checkIfAllowed(match[1], match[2])) {
        saveRecipient(chatId, match[1], null, `Bienvenido ${match[1]}! Tu login fué exitoso! tu pass no fue almacenada, por lo que tendras que loguearte semanalmente.`);
    } else {
        await bot.sendMessage(chatId, "Tu login falló por uno de los sgtes. motivos:\n- Ese usuario no esta registrado en CHW.\n- Tu password es incorrecta\n- No calificas para ver las papas.", {disable_web_page_preview: true});
    }
});

bot.onText(/\/remember (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    let pass = await passToMd5(match[2]);
    if (await checkIfAllowed(match[1], pass)) {
        saveRecipient(chatId, match[1], pass, `Bienvenido ${match[1]}! Tu login fué exitoso! tu pass fue (codificada y) almacenada, por lo que se renovará automáticamente.`);
    } else {
        await bot.sendMessage(chatId, "Tu login falló por uno de los sgtes. motivos:\n- Ese usuario no esta registrado en CHW.\n- Tu password es incorrecta\n- No calificas para ver las papas.", {disable_web_page_preview: true});
    }
});

bot.onText(/\/logout/, async (msg) => {
    const chatId = msg.chat.id;
    var result = await dataService.deleteRecipient(async function (data) {
        await bot.sendMessage(chatId, "Te deslogueaste OK, si almacenaste tu password esta ya se eliminó completamente de la BD.", {disable_web_page_preview: true});
    }, {"_id": chatId});
});

exports.sendMessage = async function () {
    await bot.sendMessage.apply(bot, arguments);
};

async function passToMd5(pass) {
    return vBulletin.md5hash(
        {
            type: "password",
            class: "textbox",
            tabindex: "102",
            name: "vb_login_password",
            id: "navbar_password",
            size: "10",
            style: "display: inline;",
            value: pass
        },
        {type: "hidden", name: "vb_login_md5password", value: ""},
        {type: "hidden", name: "vb_login_md5password_utf", value: ""},
        0
    );
};
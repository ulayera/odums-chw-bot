var exports = module.exports = {};

exports.http = require('http');
exports.cheerio = require("cheerio");
exports.MongoClient = require('mongodb').MongoClient;
exports.assert = require('assert');
exports.envService = require("../services/env-service.js");
const vBulletin = exports.vBulletin = require('../lib/vbulletin-md5');
const utilService = exports.utilService = require("../services/util-service.js");
const httpService = exports.httpService = require("../services/http-service.js");
const dataService = exports.dataService = require("../services/data-service.js");
const botLogic = exports.botLogic = require("./bot-logic");

exports.isLoggedIn = function () {
    return httpService.headers !== null;
};

exports.getPapasWeb = async function () {
    let papasWebRaw = await utilService.asyncWrapper(httpService.getPapas);
    return utilService.parseaHTMLPapas(papasWebRaw);
};

exports.getPapasDB = async function (papasWeb) {
    return await utilService.asyncWrapper(dataService.getPapasByIdlist, [utilService.toIdArray(papasWeb)]);
};

exports.getIp = function () {
    return httpService.getIp.apply(null, arguments);
};

exports.doLogin = function () {
    return httpService.doLogin.apply(null, arguments);
};

exports.mergePapas = function () {
    return utilService.mergePapas.apply(null, arguments);
};

exports.comparePapasById = function () {
    return utilService.comparePapasById.apply(null, arguments);
};

exports.compareDates = function () {
    return utilService.compareDates.apply(null, arguments);
};

exports.getPapaDetails = function () {
    return httpService.getPapaDetails.apply(null, arguments);
};

exports.sendTelegramMessage = async function () {
    return await sendTelegramMessage.apply(null, arguments);
};

exports.saveToDB = async function () {
    return await dataService.saveToDB.apply(null, arguments);
};

exports.passToMd5 = async function (pass) {
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

exports.log = async function (obj) {
    dataService.addLog(obj);
};

async function sendTelegramMessage(cb, obj) {
    let body = obj.titulo +
        "\n\nURL Web Foro : " + obj.url +
        "\n\nURL Tapatalk : https://r.tapatalk.com/shareLink?share_fid=16103&share_tid=" + obj._id + "&url=" + encodeURI(obj.url) + "&share_type=t";
    dataService.findAllRecipients(async function (recipients) {
        for (let i = 0; i < recipients.length; i++) {
            let recipient = recipients[i];
            let chatId = recipient.chatId;
            let isAllowed = true;
            if (utilService.dateDiff(recipient.date, Date()) > 6)
                if (recipient.password) {
                    isAllowed = await botLogic.checkIfAllowed(recipient.username, recipient.password);
                    await saveRecipient(chatId, recipient.username, await scrapperLogic.passToMd5(recipient.password), "Tu acceso se renovó automáticamente!");
                }
            if (isAllowed) {
                await botLogic.sendMessage(chatId, body, {disable_web_page_preview: true});
            } else {
                await botLogic.sendMessage(chatId, "Se venció tu acceso a las papas, prueba con:\n- Loguearte nuevamente con /login o /remember\n- Deslogueate con /logout.", {disable_web_page_preview: true});
            }
        }
        cb(obj);
    });
}


async function saveRecipient(chatId, user, pass, msg) {
    await dataService.saveRecipient(async function () {
        await botLogic.sendMessage(chatId, msg, {disable_web_page_preview: true});
    }, {
        "_id": chatId,
        "chatId": chatId,
        "username": user,
        "password": pass,
        "date": new Date()
    });
}
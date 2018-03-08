var exports = module.exports = {};

exports.httpService = require("../services/http-service.js");
exports.dataService = require("../services/data-service.js");
exports.utilService = require("../services/util-service.js");
exports.envService = require("../services/env-service.js");
const vBulletin = require('../lib/vbulletin-md5');

exports.isLoggedIn = function () {
    return exports.httpService.headers !== null;
};

exports.getPapasWeb = async function () {
    let papasWebRaw = await exports.utilService.asyncWrapper(exports.httpService.getPapas);
    return exports.utilService.parseaHTMLPapas(papasWebRaw);
};

exports.getPapasDB = async function (papasWeb) {
    return await exports.utilService.asyncWrapper(exports.dataService.getPapasByIdlist, [exports.utilService.toIdArray(papasWeb)]);
};

exports.doLogin = function () {
    return exports.httpService.doLogin.apply(null, arguments);
};

exports.mergePapas = function () {
    return exports.utilService.mergePapas.apply(null, arguments);
};

exports.comparePapasById = function () {
    return exports.utilService.comparePapasById.apply(null, arguments);
};

exports.compareDates = function () {
    return exports.utilService.compareDates.apply(null, arguments);
};

exports.getPapaDetails = function () {
    return exports.httpService.getPapaDetails.apply(null, arguments);
};

exports.sendTelegramMessage = async function () {
    return await exports.httpService.sendTelegramMessage.apply(null, arguments);
};

exports.saveToDB = async function () {
    return await exports.dataService.saveToDB.apply(null, arguments);
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
exports.checkIfAllowed = async function (user, pass) {
    let loginHeaders = await exports.utilService.asyncWrapper(exports.httpService.doLogin, [{
        user: user,
        pass: await exports.passToMd5(pass)
    }]);
    if (loginHeaders && loginHeaders["set-cookie"].length > 3) {
        let a = await exports.utilService.asyncWrapper(exports.httpService.getPapas, [loginHeaders]);
        b = exports.utilService.parseaHTMLPapas(a);
        return b && b.length > -1;
    } else
        return false;
};
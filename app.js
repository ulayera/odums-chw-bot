(async function () {
    const scrapperLogic = require("./logic/scrapper-logic.js");
    const name = scrapperLogic.envService.getEnv('NAME');
    const port = scrapperLogic.envService.getEnv('PORT');
    var memwatch = require('memwatch-next');
    let express = require('express');
    let app = express();
    let loginHeaders = null;

    app.get('/redirect', function (req, res) {
        res.redirect(decodeURI(req.query.url));
    });
    app.get('/', function (req, res) {
        res.send(`${name} esta arriba y funcionando!`);
    });

    app.listen(port, () => {
        console.log(`${name} is listening on port ${port}`);
    });

    console.dblog = async function (str) {
        let ip = await scrapperLogic.utilService.asyncWrapper(scrapperLogic.getIp);
        scrapperLogic.dataService.addLog({
            "level": "info",
            "msg": str,
            "date": new Date(),
            "ip": ip
        });
    };
    console.dberror = async function (str) {
        let ip = await scrapperLogic.utilService.asyncWrapper(scrapperLogic.getIp);
        scrapperLogic.dataService.addLog({
            "level": "error",
            "msg": str,
            "date": new Date(),
            "ip": ip
        });
    };

    memwatch.on('leak', async function (info) {
        await console.dberror(info)
    });
    memwatch.on('stats', async function (stats) {
        await console.dblog(stats)
    });

    async function scrappingLogic() {
        let papasWeb = await scrapperLogic.getPapasWeb(loginHeaders);
        let papasDB = await scrapperLogic.getPapasDB(papasWeb);
        let papas = scrapperLogic.mergePapas(
            papasWeb,
            papasDB
        );
        for (let i in papas) {
            let elem = papas[i];
            elem.source = "papas";
            if (!elem.post)
                await scrapperLogic.utilService.asyncWrapper(scrapperLogic.getPapaDetails, [elem]);
            if (!elem.wasNotified) {
                await scrapperLogic.utilService.asyncWrapper(scrapperLogic.sendTelegramMessage, [elem]);
                elem.wasNotified = true;
                elem.fechaModificacion = new Date();
                if (!elem.fechaCreacion)
                    elem.fechaCreacion = elem.fechaModificacion;
                await scrapperLogic.utilService.asyncWrapper(scrapperLogic.saveToDB, [elem]);
            }
        }
    }

    async function optionalScrappingLogic() {
        let papasWeb = await scrapperLogic.getOdumsWeb(loginHeaders);
        let papasDB = await scrapperLogic.getPapasDB(papasWeb);
        let papas = scrapperLogic.mergePapas(
            papasWeb,
            papasDB
        );
        for (let i in papas) {
            let elem = papas[i];
            elem.source = "odums";
            if (!elem.post)
                await scrapperLogic.utilService.asyncWrapper(scrapperLogic.getPapaDetails, [elem]);
            if (!elem.wasNotified) {
                await scrapperLogic.utilService.asyncWrapper(scrapperLogic.sendTelegramMessage, [elem]);
                elem.wasNotified = true;
                elem.fechaModificacion = new Date();
                if (!elem.fechaCreacion)
                    elem.fechaCreacion = elem.fechaModificacion;
                await scrapperLogic.utilService.asyncWrapper(scrapperLogic.saveToDB, [elem]);
            }
        }
    }

    async function doLogin() {
        loginHeaders = await scrapperLogic.utilService.asyncWrapper(scrapperLogic.doLogin, [{
            user: scrapperLogic.envService.getEnv('FORUM_USER'),
            pass: scrapperLogic.envService.getEnv('FORUM_MD5PASS')
        }]);
    }

//se invoca cada cierto tiempo segun configuracion de archivo .env
    try {
        console.dblog("Iniciando Scrapping");
        await doLogin();
        await scrappingLogic();
        await optionalScrappingLogic();
        (async function repeatLogic() {
            setTimeout(
                async function () {
                    await scrappingLogic();
                    await optionalScrappingLogic();
                    repeatLogic();
                },
                parseInt(scrapperLogic.envService.getEnv("REFRESH_SECONDS")) * 1000
            );
        })();
    } catch (e) {
        console.dberror(e);
    }
    // try {
    //     await scrapperLogic.checkAndSaveForumsAccess();
    //     (async function repeatCheck() {
    //         setTimeout(
    //             async function () {
    //                 await scrapperLogic.checkAndSaveForumsAccess();
    //                 repeatCheck();
    //             },
    //             parseInt(scrapperLogic.envService.getEnv("FORUM_ACCESS_REFRESH_SECONDS")) * 1000
    //         );
    //     })();
    // } catch (e) {
    //     console.dberror(e);
    // }
})();
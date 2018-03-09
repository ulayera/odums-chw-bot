(async function () {
    require('dotenv').config();
    const scrapperLogic = require("./logic/scrapper-logic.js");
    const name = 'papas-chw-bot';
    const port = '3000';

    let express = require('express');
    let app = express();

    app.get('/redirect', function (req, res) {
        res.redirect(decodeURI(req.query.url));
    });
    app.get('/', function (req, res) {
        res.send(`${name} esta arriba y funcionando!`);
    });

    app.listen(port, () => {
        console.log(`${name} is listening on port ${port}`);
    });

    console.log = async function (str) {
        let ip = await scrapperLogic.utilService.asyncWrapper(scrapperLogic.getIp);
        scrapperLogic.dataService.addLog({
            "level": "info",
            "msg": str,
            "date": new Date(),
            "ip" : ip
        });
    };
    console.error = async function (str) {
        let ip = await scrapperLogic.utilService.asyncWrapper(scrapperLogic.getIp);
        scrapperLogic.dataService.addLog({
            "level": "error",
            "msg": str,
            "date": new Date(),
            "ip" : ip
        });
    };

    async function scrappingLogic() {
        let a = Date.now();
        if (!scrapperLogic.isLoggedIn())
            await scrapperLogic.utilService.asyncWrapper(scrapperLogic.doLogin);
        if (scrapperLogic.isLoggedIn()) {
            let papasWeb = await scrapperLogic.getPapasWeb();
            let papasDB = await scrapperLogic.getPapasDB(papasWeb);
            let papas = scrapperLogic.mergePapas(
                papasWeb,
                papasDB
            );
            for (let i in papas) {
                let elem = papas[i];
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
        console.log("scrappingLogic lasted: " + (Date.now() - a) / 1000 + " seconds at " + scrapperLogic.utilService.formattedDate(new Date()));
    }

//se invoca cada cierto tiempo segun configuracion de archivo .env
    (async function repeat() {
        setTimeout(
            async function () {
                await scrappingLogic();
                repeat();
            },
            parseInt(scrapperLogic.envService.getEnv("REFRESH_SECONDS")) * 1000
        );
    })();
})();
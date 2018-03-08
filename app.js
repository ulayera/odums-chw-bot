(async function () {
    require('dotenv').config();
    const scrapperLogic = require("./logic/scrapper-logic.js");
    const name = 'papas-chw-bot';
    const port = '3000';

    const http = require('http');
    const app = new http.Server();

    app.on('request', async (req, res) => {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write(`${name} está arriba y funcionando!`);
        res.end('\n');
    });
    app.listen(port, () => {
        console.log(`${name} is listening on port ${port}`);
    });

    async function scrappingLogic() {
        if (!scrapperLogic.isLoggedIn())
            await scrapperLogic.utilService.asyncWrapper(scrapperLogic.doLogin);
        if (scrapperLogic.isLoggedIn()) {
            let papasWeb = await scrapperLogic.getPapasWeb();
            let papasDB = await scrapperLogic.getPapasDB(papasWeb);
            let papas = scrapperLogic.mergePapas(
                papasWeb,
                papasDB
            );
            for (var i in papas) {
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
    }

//se invoca cada cierto tiempo segun configuracion de archivo .env
    scrappingLogic();
    setInterval(scrappingLogic, parseInt(scrapperLogic.envService.getEnv("REFRESH_SECONDS")) * 1000);
})();
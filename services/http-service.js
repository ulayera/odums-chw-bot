var exports = module.exports = {};

const http = module.parent.exports.http;
const envService = module.parent.exports.envService;
const utilService = module.parent.exports.utilService;
const sensitive = {
    "forum": {
        "s": envService.getEnv('FORUM_S')
    }
};
let serverIp = null;

exports.headers = null;

exports.getIp = async function (cb) {
    if (!serverIp) {
        await http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function (resp) {
            resp.on('data', function (ip) {
                serverIp = ip.toString('latin1');
            });
            resp.on('error', function (e) {
                cb(e);
            });
        });
    }
    cb(serverIp);
};

exports.getProxy = async function (cb) {
    let url = "https://";
    await http.get({'host': 'api.getproxylist.com', 'port': 443, 'path': '/proxy?country=CL'}, function (resp) {
        resp.on('data', function (obj) {
            cb(`http://${obj.ip}:${obj.port}`);
        });
        resp.on('error', function (e) {
            cb(e);
        });
    });
};

exports.doLogin = function (cb, login) {
    let data = `do=login&vb_login_md5password=${login.pass}&vb_login_md5password_utf=${login.pass}&` +
        `s=${sensitive.forum.s}&securitytoken=guest&url=%2Fforo%2Fforumdisplay.php%3Ff%3D168&vb_login_username=${login.user}&vb_login_password=&cookieuser=1`;
    var post_options = {
        host: 'www.chw.net',
        port: '80',
        path: '/foro/login.php?do=login',
        method: 'POST',
        headers: {
            "accept-language": "en",
            "Content-Length": Buffer.byteLength(data),
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
            console.dberror(err);
            cb(false);
        }
    });
    post_req.write(data);
    post_req.end();
};

exports.getHome = function (cb, headers) {
    var strCookies = "";
    let useHeaders;
    if (headers) {
        useHeaders = headers;
    } else {
        useHeaders = exports.headers;
    }
    for (var i = 0; i < useHeaders["set-cookie"].length; i++)
        strCookies += useHeaders["set-cookie"][i] + "; ";
    let path = '/foro/';
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
        console.dberror(e);
        cb(e);
    });
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
        console.dberror(e);
        cb(e);
    });
};


exports.getOdums = function (cb, headers) {
    var strCookies = "";
    let useHeaders;
    if (headers) {
        useHeaders = headers;
    } else {
        useHeaders = exports.headers;
    }
    for (var i = 0; i < useHeaders["set-cookie"].length; i++)
        strCookies += useHeaders["set-cookie"][i] + "; ";
    let path = '/foro/ofertas-ultimo-minuto/?pp=10&daysprune=-1&sort=dateline&prefixid=&order=desc';
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
        console.dberror(e);
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
        console.dblog('ERROR: ' + e.message);
    });
};
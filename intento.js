var https = require('https');
let request = require('request');

exports.getProxy = async function (cb) {
    request('https://api.getproxylist.com/proxy',
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                body = JSON.parse(body);
                cb(`http://${body.ip}:${body.port}`);
            } else {
                cb((error) ? error : response.statusMessage)
            }
        });
};

exports.getThroughProxy = async function (cb, url, proxy) {
    request.get(url, {'proxy': proxy, "timeout": 3000},
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                cb(body);
            } else {
                cb((error) ? error : response.statusMessage)
            }
        });
};

exports.getProxy(function (strProxy) {
    console.log(strProxy);
    exports.getThroughProxy(function (body) {
        console.log(body);
    }, "https://api.ipify.org?format=json", strProxy)
});
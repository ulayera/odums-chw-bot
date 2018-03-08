var exports = module.exports = {};
var cheerio = require("cheerio");

exports.asyncWrapper = async function(func, args) {
    if (!args) args = [];
    return new Promise((resolve, reject) => {
        args.unshift(function (value) {
            if (value instanceof Error) {
                reject(value);
            } else {
                resolve(value);
            }
        });
        func.apply(this, args);
    });
};

exports.parseaHTMLPapas = function (body, foro) {
    const $ = cheerio.load(body);
    var output = [];
    var hilos = $("#threads li");
    for (var i = 0; i < hilos.length; i++) {
        const $ = cheerio.load(hilos[i]);
        try {
            var obj = {
                "_id" : hilos[i].attribs.id.split('_')[1],
                "autor" : $("a.username")[0].children[0].data,
                "titulo" : $("a.title")[0].children[0].data,
                "desc" :  $("div.threadinfo")[0].attribs.title,
                "url" :  $("a.title")[0].attribs.href,
                "source" : foro
            };
            output.push(obj);
        } catch (e) {
        }
    }
    return output;
};

var stripHTML = function (elements, strBuffer) {
    for (var i = 0; i < elements.length; i++) {
        let row = elements[i];
        try {
            if (row.type === 'text')
                strBuffer = concatNoDuplicate(strBuffer, row.data);
            else if (row.type === 'tag' && row.name === 'a') {
                strBuffer = concatNoDuplicate(strBuffer , '\n' + row.attribs.href + '\n');
            } else if (row.type === 'tag' && row.name === 'img') {
                if (row.attribs.src.indexOf('base64') === -1)
                    strBuffer = concatNoDuplicate(strBuffer , '\n' + row.attribs.src + '\n');
            } else if (row.children && row.children.length > 0) {
                strBuffer = stripHTML(row.children, strBuffer);
            }
        } catch (e) {
            console.log(e);
        }
    }
    return strBuffer;
};
var concatNoDuplicate = function(str1, str2) {
    if (str1.indexOf(str2) < 0)
        return str1 + str2;
    else
        return str1;
};

exports.parseaHTMLPapaDetails = function (body) {
    var strBuffer = "";
    let subcontent = cheerio.load(body)("div.postbody")[0];
    if (subcontent) {
        let content = cheerio.load(subcontent)("div.content div blockquote");
        strBuffer += stripHTML(content[0].children, strBuffer);
    }
    return strBuffer;
};

exports.toIdArray = function(list) {
    let result = [];
    for (let i = 0; i < list.length; i++) {
        result.push(list[i]._id);
    }
    return result;
};

exports.mergePapas = function (arr1, arr2) {
    for (let i = 0; i < arr1.length; i++) {
        let contains = false;
        for (let j = 0; j < arr2.length; j++) {
            if (arr2[j]._id === arr1[i]._id)
                contains = true;
        }
        if (!contains)
            arr2.push(arr1[i]);
    }
    return arr2;
};

exports.splitUrl = function (url) {
    var urlObj = {};
    url = url.replace("http://", '');
    url = url.replace("https://", '');
    urlObj.hostname = url.split("/")[0];
    urlObj.pathname = url.replace(urlObj.hostname, '');
    return urlObj;
};

exports.comparePapasById = function (a,b) {
    var ida = parseInt(a._id);
    var idb = parseInt(b._id);
    if (ida > idb)
        return 1;
    if (ida < idb)
        return -1;
    return 0;
};

exports.compareDates = function(a,b){
    if (b.getTime() < a.getTime())
        return -1;
    else if (a.getTime() < b.getTime())
        return 1;
    else
        return 0;
};
exports.dateDiff = function(date1, date2) {
    dt1 = new Date(date1);
    dt2 = new Date(date2);
    return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate()) ) /(1000 * 60 * 60 * 24));
};
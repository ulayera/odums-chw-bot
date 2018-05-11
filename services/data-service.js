var exports = module.exports = {};
const envService = module.parent.exports.envService;
const MongoClient = module.parent.exports.MongoClient;
const assert = module.parent.exports.assert;
const sensitive = {
    "db": {
        "user": envService.getEnv('DB_USER'),
        "password": envService.getEnv('DB_PASS'),
        "host": envService.getEnv('DB_HOST'),
        "port": envService.getEnv('DB_PORT'),
        "dbname": envService.getEnv('DB_DBNAME')
    }
};
let url = `mongodb://${sensitive.db.user}:${sensitive.db.password}@${sensitive.db.host}:${sensitive.db.port}/${sensitive.db.dbname}`;

exports.getPapasByIdlist = function (cb, idList) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection('papas');
        collection.find({_id: {$in: idList}}, function (err, result) {
            if (err)
                cb(err);
            result.toArray(function (err, arr) {
                if (err)
                    cb(err);
                cb(arr);
            });
        });
        db.close();
    });
};

exports.saveToDB = async function (cb, obj) {
    MongoClient.connect(url, async function (err, db) {
        assert.equal(null, err);
        let collection = db.collection('papas');
        await collection.updateOne({_id: obj._id}, obj, {upsert: true}, function (err, result) {
            db.close();
            if (err)
                cb(err);
            else
                cb(result);
        });
    });
};

exports.findAllRecipients = function (cb) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection('recipients');
        collection.find({}, function (err, result) {
            if (err) {
                db.close();
                cb(err);
            } else {
                result.toArray(function (err, arr) {
                    db.close();
                    if (err)
                        cb(err);
                    cb(arr);
                });
            }
        });
    });
};

exports.saveRecipient = function (cb, obj) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection('recipients');
        collection.updateOne({_id: obj._id}, obj, {upsert: true}, function (err, result) {
            db.close();
            cb(obj);
        });
    });
};

exports.deleteRecipient = async function (cb, obj) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection('recipients');
        collection.deleteOne({_id: obj._id}, obj, function (err, result) {
            db.close();
            if (err)
                cb(err);
            cb(result);
        });
    });
};

exports.addLog = function (obj) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection('logs');
        collection.insertOne(obj);
    });
};
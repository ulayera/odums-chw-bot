var exports = module.exports = {};

exports.getEnv = function(str){
    return process.env[str];
};
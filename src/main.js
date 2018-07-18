var version = require('./version').v

var Connector = require('./transport/connector')

var Api = require('./api')

var Config = require('./config')

var UIMClientSDK = function() {
    // require('./init').init()
    var connector = new Connector()

    this.api = new Api(this.version, connector)
    connector.connect(Config.api_url)
}

UIMClientSDK.prototype.version = version

module.exports = new UIMClientSDK()


// var Api = require('./api') 

var Storage = require('./storage')

// do auth
UIMClientSDK.prototype.doAuth = function(token, cb) {
    this.api.doAuth(this.token, function(result) {
        cb(result)
    })
}

UIMClientSDK.prototype.send = function(msg) {
    this.api.sendMessage(msg)
}

/**
 * 返回当前关联的账号列表
 */
UIMClientSDK.prototype.accounts = function() {
    return Storage.get('accounts')
}

UIMClientSDK.prototype.account = function(id) {
    accounts = Storage.get('accounts')
    return accounts[id]
}

UIMClientSDK.prototype.token = function(token) {
    this.token = token
    return this
}

var EventEmitter = require('./event')

var Api = function(version, connector) {
    this.version = version
    this.id = null
    this.sid = null
    this.session = {}
    this.connector = connector
    this.iids = 0

    this.e = new EventEmitter()

    var that = this
    connector.e.on('received', function(data) {
        that.received(data)
    })

    // Heartbeat support
    this.last_receive = null
    this.last_receive_overdue = false
}

Api.prototype.heartbeat = function(timeout, timeout2) {
    // Heartbeat emitter.
	var last_receive = this.last_receive
	if (this.connector.connected) {
		if (last_receive !== null) {
			// console.log("api heartbeat", this.last_receive)
			var now = new Date().getTime()
			if (this.last_receive_overdue) {
				if (now > last_receive + timeout2) {
					console.log("Reconnecting because alive timeout was reached.")
					this.last_receive_overdue = false
					this.last_receive = null
					this.connector.disconnect(true)
				}
			} else {
				if (now > last_receive + timeout) {
					//console.log("overdue 1")
					this.last_receive_overdue = true
					this.sendAlive(now)
				}
			}
		}
	} else {
		this.last_receive = null
		this.last_receive_overdue = false
	}
}

Api.prototype.send = function(type, data, noqueue) {
    var payload = {
        Type: type,
        Data: data
    };
    //console.log("<<<<<<<<<<<<", JSON.stringify(payload, null, 2));
    this.connector.send(payload, noqueue)
}

Api.prototype.send2 = function(name, cb) {
    var obj = {
        send: _.bind(function(type, data) {
            if (cb) {
                cb(type, data)
            }
            this.send(type, data)
        }, this)
    }
    return this.apply(name, obj)
}

Api.prototype.request = function(type, data, cb, noqueue) {
    var payload = {
        Type: type,
        Data: data
    }

    if (cb) {
        var iid = ''+(this.iids++)
        payload.Iid = iid
        this.e.one(iid+'.request', cb)
    }
    this.connector.send(payload, noqueue)
}

// Helper hack function to send API requests to other destinations.
// Simply provide an alternative send function on the obj Object.
Api.prototype.apply = function(name, obj) {
	var f = this[name]
	return _.bind(f, obj)
}

Api.prototype.received = function(d) {
    // Store received timestamp.
    var now = new Date().getTime()
    this.last_receive = now
    this.last_receive_overdue = false

    console.log('received: ', d)

    var iid = d.Iid
    var data = d.Data
    var dataType = d.Type

    if (iid) {
        // Shortcut for iid registered responses.
        this.e.triggerHandler(iid+'.request', [dataType, data]);
        return;
    }

    switch (dataType) {
        case "AccountInfo": // 账户信息
            // console.log("Self received", data);
            if (data.Token) {
                this.connector.token = data.Token
            }
            this.id = data.Id
            this.sid = data.Sid
            this.e.triggerHandler("received.account", [data])
            break
        case "IMProfile":    // 返回给定im账号信息
            //console.log("IMMessage received", data.To, data.Answer);
            this.e.triggerHandler("received.improfile", [data.Messages]);
            break;
        case "IMMessage":   // 收到聊天消息
            //console.log("IMMessage received", data.To, data.Answer);
            this.e.triggerHandler("received.immessage", [data.Messages]);
            break;
        case "IMContacts":    // 返回给定im账号的联系人信息
            //console.log("Connected users: " + data.Users.length);
            this.e.triggerHandler("received.imcontacts", [data.Users]);
            break;
        default:
            console.log("Unhandled type received:", dataType, data);
            break;
    }
}


Api.prototype.requestAccountInfo = function(success, fault) {
    var data = {
        Version: this.version,
        Ua: this.userAgent,
        Name: name,
        Type: "" // Selects the default room type.
    };

    if (pin) {
        data.Credentials = {
            PIN: pin
        };
    }

    var that = this;
    var onResponse = function(event, type, data) {
        if (type === "AccountInfo") {
            if (success) {
                success(data.Account)
            }
            that.e.triggerHandler("received.accountinfo", [data.Account])
        } else {
            if (fault) {
                fault(data)
            }
        }
    }

    this.request("requestAccountInfo", data, onResponse, true)
}

Api.prototype.sendMessage = function(msg) {
    return this.send('IMMessage', msg)
}

Api.prototype.doAuth = function(token, cb) {
    var onResponse = function(event, type, data) {
        cb(data)
    }

    var data = { Token: token }

    return this.request('doAuth', data, onResponse, false)
}

module.exports = Api
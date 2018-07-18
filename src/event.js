
var EventEmitter = function() {
    this.handlerMap = {}
    this.onceHandlerMap = {}
}

EventEmitter.prototype.triggerHandler = function(event, args) {
    if (this.handlerMap[event] instanceof Array){
        var handlers = this.handlerMap[event];

        for (var i = 0, len = handlers.length; i < len; i++){
            console.log('triggerHandler: ', args)
            handlers[i].apply(this, args)
        }
    }

    // once
    if (this.onceHandlerMap[event] instanceof Array){
        var handlers = this.onceHandlerMap[event];

        for (var i = 0, len = handlers.length; i < len; i++){
            handlers[i].apply(this, args)
        }

        delete this.onceHandlerMap[event]
    }
}

EventEmitter.prototype.on = function(event, handler) {
    var handlers = this.handlerMap[event]
    if (handlers == undefined) {
        handlers = []
        this.handlerMap[event] = handlers
    }

    handlers.push(handler)
}

EventEmitter.prototype.one = function(event, handler) {
    var handlers = this.onceHandlerMap[event]
    if (handlers == undefined) {
        handlers = []
        this.onceHandlerMap[event] = handlers
    }

    handlers.push(handler)
}


module.exports = EventEmitter
/**
 * Neutrino.js v0.5
 * tiny js framework with inheritance and events
 * http://github.com/alevkon/neutrino/
 *
 * Copyright 2012, Alexey Konyshev alevkon@gmail.com
 * MIT license
 */
var _neutrino = _n = {
    utils: {
        bind: function(method, context) {
            var args = Array.prototype.slice.call(arguments, 2);
            return function() {
                var a = args.concat(Array.prototype.slice.call(arguments, 0));
                return method.apply(context, a);
            }
        }
    }
};
(function(_n) {
    function extend(c, p) {
        var f = function() { };
        f.prototype = p.prototype;
        c.prototype = new f();
        c.prototype.constructor = c;
        c.superclass = p.prototype;
    }
    function wrapMethod(method, _superMethod) {
        var wrappedMethod =  function () {
            var self = this, originalArguments = arguments;
            var buffer = { _superMethod: this._superMethod, _superCall: this._superCall };
            this._superMethod = _superMethod;
            this._superCall = function() {
                return _superMethod.apply(self, originalArguments);
            };
            var result =  method.apply(this, arguments);
            this._superMethod = buffer._superMethod;
            this._superCall = buffer._superCall;
            return result;
        };
        wrappedMethod._originalMethod = method;
        return wrappedMethod;
    }
    function getMergedPrototypeProperty (objectConstructor, propertyName) {
        var chain = []
        ,   property = {};
        for (var p = objectConstructor.prototype; !!p; p = p.constructor.superclass) {
            if (p.hasOwnProperty(propertyName)) {
                chain.push(p[propertyName]);
            }
        }
        for (var i=chain.length - 1; i>=0; i--) {
            $.extend(true, property, chain[i]);
        }
        return property;
    }
    _n.Root = function() {};
    _n.Root.defaults = {};
    _n.Root.prototype.construct = function Root(data) {
        this._subscribers = {};
        if (!this.data) {
            this.data = {};
        }
        $.extend(true, this.data, getMergedPrototypeProperty(this.constructor, "defaults"), data);
    };
    _n.Root.extend = function(classInfo) {
        var f = function Root() {
            return this.construct.apply(this, arguments);
        };
        f.extend = _n.Root.extend;
        extend(f, this);
        for (var i in classInfo) {
            var property = classInfo[i];
            if (property instanceof Function) {
                if (f.prototype[i] instanceof Function) {
                    property = wrapMethod(property, f.prototype[i]);
                }
                (function(property) {
                    property.bind = function(context, args) {
                        return _n.utils.bind(property, context, args);
                    }
                }) (property);
            }
            f.prototype[i] = property;
        }
        return f;
    };
    _n.Root.prototype.subscribe = function (handler, eventName) {
        if (!eventName) eventName = "*";
        if (!this._subscribers[eventName]) this._subscribers[eventName] = [];
        this._subscribers[eventName].push(handler);
    };
    _n.Root.prototype.fireEvent = function(eventName, info) {
        this.onOwnEvent(eventName, info);
        var eventClasses = ["*", eventName];
        for (var i=0; i<eventClasses.length; i++) {
            var eventClass = eventClasses[i];
            if (this._subscribers[eventClass]) {
                for (var j=0; j<this._subscribers[eventClass].length; j++) {
                    this._subscribers[eventClass][j](eventName, info);
                }
            }
        }
    };
    _n.Root.prototype.onOwnEvent = function() {};
})(_neutrino);
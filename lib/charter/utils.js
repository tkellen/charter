define(function (require) {

  "use strict";

  var nativeForEach = Array.prototype.forEach;
  var breaker = {};
  var each = function (obj, iterator, context) {
    if (nativeForEach && obj.forEach === Array.prototype.forEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };
  var idCounter = 0;

  /**
    Util (private)

    @class Util
    @module Util
  */
  var Util = {

    each: each,

    extend: function (obj) {
      each(Array.prototype.slice.call(arguments, 1), function (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      });
      return obj;
    },

    uniqueId: function(prefix) {
      var id = idCounter++;
      return prefix ? prefix + id : id;
    },

    emptyObject: function(ob) {
      for (var prop in ob) {
        if (ob.hasOwnProperty(prop)) {
          return false;
        }
      }
      return true;
    },

    noop: function() {},

    applyConfig: function (obj, hash, callback) {
      hash = hash||{};
      callback = callback||function(){};
      for (var name in hash) {
        obj[name] = hash[name];
        callback.apply(obj, [name, hash[name]]);
      }
    }

  };

  return Util;

});
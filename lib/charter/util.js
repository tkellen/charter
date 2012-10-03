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
  var extend = function (obj) {
    each(Array.prototype.slice.call(arguments, 1), function (source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };
  var ids = 0;

  /**
    Utilities

    @class Util
    @module Charter
    @private
  */
  var Util = {

    each: each,

    extend: extend,

    id: function() { return ++ids; },

    emptyObject: function(ob) {
      for (var prop in ob) {
        if (ob.hasOwnProperty(prop)) {
          return false;
        }
      }
      return true;
    },

    noop: function() {},

    creator: function (Constructor) {
      return function () {
        // combine all arguments into a single object
        Array.prototype.unshift.call(arguments, {});
        var config = extend.apply(this, arguments);
        return new Constructor(config);
      };
    }
  };

  return Util;

});
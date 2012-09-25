define(function (require) {

  "use strict";

  /**
    Mixins (private)

    @class Mixin
    @module Mixin
  */
  var Mixin = {
    /**
      Mix
      {{#crossLink "Traversal/traverse"}}{{/crossLink}},
      {{#crossLink "Traversal/get"}}{{/crossLink}}, and
      {{#crossLink "Traversal/set"}}{{/crossLink}} into the prototype of an object.

      @method Traversal
      @param obj {Object} An object whose prototype will receive traversal functions.
      @return {Object} The modified object.
    */
    Traversal: function (obj) {
      obj.prototype.traverse = Traversal.traverse;
      obj.prototype.get = Traversal.get;
      obj.prototype.set = Traversal.set;
      return obj;
    },

    computed: function(method) {
      method.__computed = true;
      return method;
    },

    applyConfig: function(obj, hash, callback) {
      hash = hash||{};
      callback = callback||function(){};
      for (var name in hash) {
        obj[name] = hash[name];
        callback.apply(obj, [name, hash[name]]);
      }
    },

    emptyObject: function(ob) {
      for (var prop in ob) {
        if (ob.hasOwnProperty(prop)) {
          return false;
        }
      }
      return true;
    },

    noop: function() {}

  };

  /**
    Traversal (private)

    @class Traversal
    @module Mixin
  */
  var Traversal = {

    /**
      Set or get a value from an object using dot notation.  Typically called by
      {{#crossLink "Traversal/get"}}{{/crossLink}} and
      {{#crossLink "Traversal/set"}}{{/crossLink}}.

      @method traverse
      @param context {Object} The object to get or set within.
      @param lookup {String|Array} A dot notated lookup string or array of segments.
      @param value {Mixed} The value to assign.
      @return {Mixed} The requested or sent value.
    */
    traverse: function (context, lookup, value) {
      var result = context;

      // If no lookup defined, return entire context.
      if (!lookup) {
        return context;
      }
      // If lookup is a string, split on '.' for dot notation lookup.
      if (typeof lookup === "string") {
        lookup = lookup.split('.');
      }
      // Search context to locate requested node.
      for (var i=0, len = lookup.length; i < len; i++) {
        // If result exists and we are setting, stop one level early
        // and use the final lookup segment to reference
        if (value && i+1 === len) {
          return (result[lookup[i]] = value);
        }
        if(result[lookup[i]]) {
          // if property is computed, call function to get value
          if(result[lookup[i]].__computed) {
            result = result[lookup[i]].apply(result);
          } else {
            result = result[lookup[i]];
          }
          continue;
        }
        return undefined;
      }
      return result;
    },

    /**
      Retrieve value from the current object using dot notation.

      @method get
      @param lookup {String|Array} A dot notated lookup string or array of segments.
      @return {Mixed} The requested value.
    */
    get: function (lookup) {
      return this.traverse(this, lookup);
    },

    /**
      Set value in the current object using dot notation.

      @method set
      @param lookup {String|Array} A dot notated lookup string or array of segments.
      @param value {Mixed} The value to assign.
      @return {Mixed} The requested value.
    */
    set: function (lookup, value) {
      return this.traverse(this, lookup, value);
    }

  };

  return Mixin;

});
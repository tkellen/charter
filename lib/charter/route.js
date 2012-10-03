define(function (require) {

  'use strict';

  var State = require('charter/state');
  var Util = require('charter/util');

  /**
    Routable State Chart

    @class Route
    @module Charter
    @extends State
  */
  var Route = function (config) { this.init(config); };

  /**
    Create a Routable State Chart

    @method create
    @static
    @param config {Object} The states's configuration.
    @return {Route} An instance of Charter.Route.
  */
  Route.create = Util.creator(Route);

  Route.prototype = Util.extend({}, State.prototype, {

    /**
      Type definition.

      @property type
      @type {String}
      @default "charter/route"
      @final
    */
    type: 'charter/route',

    /**
      Initialize a route state and configure its hierarchy.

      @method init
      @private
      @param config {Object} The route configuration.
    */
    init: function (config) {

      State.prototype.init.call(this, config);
    }


  });

  return Route;
});
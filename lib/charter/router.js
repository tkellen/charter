define(function (require) {

  'use strict';

  var Machine = require('charter/machine');
  var Util = require('charter/util');

  /**
    Routable State Chart

    @class Route
    @module Charter
    @extends Machine
  */
  var Router = function (config) { this.init(config); };

  /**
    Create a Routable State Chart

    @method create
    @static
    @param config {Object} The states's configuration.
    @return {Route} An instance of Charter.Route.
  */
  Router.create = Util.creator(Router);

  Router.prototype = Util.extend({}, Machine.prototype, {

    /**
      Type definition.

      @property type
      @type {String}
      @default "charter/router"
      @final
    */
    type: 'charter/router',

    /**
      Initialize a Routing State Machine and configure its hierarchy.

      @method init
      @private
      @param config {Object} The router configuration.
    */
    init: function (config) {
      config.initialState = config.initialState||'root';

      Machine.prototype.init.call(this, config);
    }
  });


  return Router;
});
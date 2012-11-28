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
      this.initialState = 'root';

      Machine.prototype.init.call(this, config);
    },


    /**
      Route to the appropriate state from a url.

      @method route
      @param path {String} The url to route to.
    */
    route: function(path) {
      //this.abortRoutingPromises();

      this.isRouting = true;

      var routableState;

      try {
        path = path.replace(this.rootURL, '');
        path = path.replace(/^(?=[^\/])/, "/");

        this.send('navigateAway');
        this.send('unroutePath', path);

        routableState = this.currentState;

        while (routableState && !routableState.get('isRoutable')) {
          routableState = routableState.parentState;
        }
        var currentURL = routableState ? routableState.absoluteRoute(this) : '';
        var rest = path.substr(currentURL.length);

        this.send('routePath', rest);
      } finally {
        this.isRouting = false;
      }

      routableState = this.currentState;
      while (routableState && !routableState.isRoutable()) {
        routableState = routableState.parentState;
      }

      if (routableState) {
        routableState.updateRoute(this, this.location);
      }
    }
  });


  return Router;
});
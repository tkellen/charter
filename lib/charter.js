define(function (require) {

  "use strict";

  /**
    Finite State Machine with Routing

    @module Charter
  */
  return {

    /**
      Holds current version.

      @property VERSION
      @type String
    **/
    VERSION: '0.1.0',

    /**
      State Charts

      @property State
      @type {Constructor}
    */
    State: require('charter/state'),

    /**
      State Machine

      @property Chart
      @type {Constructor}
    */
    Machine: require('charter/machine'),

    /**
      Routable State Charts

      @property Route
      @type {Constructor}
    */
    Route: require('charter/route'),

    /**
      Routing State Machine

      @property Router
      @type {Constructor}
    */
    Router: require('charter/router')
  };

});

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
      State

      @property State
      @type {Constructor}
    */
    State: require('charter/state'),

    /**
      State Machine

      @property Chart
      @type {Constructor}
    */
    Machine: require('charter/machine')

  };

});

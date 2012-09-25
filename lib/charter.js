define(function (require) {

  "use strict";

  /**
    Finite State Charts with Routing

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
      State Chart

      @property Chart
      @type {Constructor}
    */
    Chart: require('charter/chart')

  };

});

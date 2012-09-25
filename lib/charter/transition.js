define(function (require) {

  'use strict';

  /**
    Normalizes enter, exit and shared parent states for a transition.

    @class Transition
    @private
  */
  var Transition = function (config) {

    config = config||{};
    this.enterStates = config.enterStates.slice();
    this.exitStates = config.exitStates.slice();
    this.sharedParent = config.sharedParent;
    this.finalState = config.enterStates[config.enterStates.length - 1] || config.sharedParent;

  };

  Transition.create = function (config) { return new Transition(config); };

  Transition.prototype = {

    type: "charter/transition",

    /**
      Normalize the passed in enter, exit and resolve states.

      This process also adds `finalState` and `contexts` to the Transition object.

      @method normalize
      @param {Ember.StateManager} manager the state manager running the transition
      @param {Array} contexts a list of contexts passed into `transitionTo`
    */
    normalize: function (manager, contexts) {
      this.matchContextsToStates(contexts);
      this.addInitialStates();
      this.removeUnchangedContexts(manager);
      return this;
    }

  };

  return Transition;
});
define(function (require) {

  'use strict';

  var Mixin = require('charter/mixin');

  /**
    Finite state machine.

    @class State
    @module Charter
    @extends Traversal
  */
  var State = function (config) {

    config = config||{};

    /**
      Name of this state.  States which have been assigned as children
      to another state will automatically be named as they key they were
      stored under.

      @property name
      @type {String}
      @default "state"
    */
    this.name = config.name||"state";

    /**
      A value indicating whether the state takes a context.

      @property hasContext
      @type {Boolean}
      @default true
    */
    this.hasContext = true;

    /**
      A reference to the parent state.

      @property parentState
      @type {State}
    */
    this.parentState = null;

    /**
      Default transition event.

      @event setup
      @param {Charter.StateManager} manager
      @param context
      @see Charter.StateManager#transitionEvent
    */
    this.setup = Mixin.noop;

    /**
      This event fires when the state is entered.

      @event enter
      @param {Charter.StateManager} manager
    */
    this.enter = Mixin.noop;

    /**
      This event fires when the state is exited.

      @event exit
      @param {Charter.StateManager} manager
    */
    this.exit = Mixin.noop;

    /**
      A hash containing all child states of this state.

      @property states
      @type {Object}
      @default {}
    */
    this.states = {};

    /**
      A cache holding transition sets required to move from
      this state into another *populated by Chart#getTransitions.*

      @property pathsCache
      @type {Object}
      @default {}
    */
    this.pathsCache = {};
    this.pathsCacheNoContext = {};
    this.eventTransitions = {};

    // initialize child states
    this.init(config);

    /**
      Indicates if this is a leaf in a state hierarchy.
      False if it has any child states, true otherwise.

      @property isLeaf
      @type {Boolean}
    */
    this.isLeaf = Mixin.emptyObject(this.states);
  };

  /**
    Convenience method to create a State.

    @method create
    @static
    @param config {Object} The state configuration.
    @return {State} An instance of Charter.State.
  */
  State.create = function (config) { return new State(config); };

  State.prototype = {

    type: "charter/state",
    isState: true,

    /**
      Initialize a state and configure its hierarchy.

      @method init
      @param config {Object} The state configuration.
    */
    init: function (config) {
      var name, value, states;

      states = {};

      // setup explicitly defined child states
      this.states = config.states||{};
      for (name in this.states) {
        this.setupChild(states, name, this.states[name]);
      }

      // apply configuration and setup any properties that were states
      Mixin.applyConfig(this, config, function(key, val) {
        if (val.isState) {
          this.setupChild(states, key, val);
          delete this[key];
        }
      });

      // apply states hash
      this.states = states;
    },

    /**
      Configure a child state.

      @method setupChild
      @param states {Object} A reference to the states object to modify
      @param name {String} The name of the state being set up.
      @param child {State} An instance of Charter.State to be configured.
    */
    setupChild: function (states, name, child) {
      var transitionTarget;

      if ((transitionTarget = child.transitionTarget)) {
        this.eventTransitions[name] = transitionTarget;
      }

      // give child a reference to its parent
      child.parentState = this;

      // name child what it was keyed on in the parent
      child.name = name;

      // assign to states hash
      states[name] = child;
    },

    /**
      The full path to this state, taking all parentStates into account.

      @method path
      @type String
    */
    path: Mixin.computed(function () {
      if (this.parentState && this.parentState.isState) {
        return this.parentState.path()+'.'+this.name;
      } else {
        return this.name;
      }
    }),

    lookupEventTransition: function (name) {
      var path;
      var state = this;

      while(state && !path) {
        path = state.eventTransitions[name];
        state = state.parentState;
      }
      return path;
    }

  };

  return Mixin.Traversal(State);
});
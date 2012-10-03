define(function (require) {

  'use strict';

  var Util = require('charter/util');
  var Traversal = require('charter/traversal');

  /**
    Finite state chart building block.

    @class State
    @module Charter
    @extends Traversal
  */
  var State = function (config) { this.init(config); };

  /**
    Create a State hierarchy.

    @method create
    @static
    @param config {Object} The state configuration.
    @return {State} An instance of Charter.State.
  */
  State.create = Util.creator(State);

  State.prototype = Util.extend({}, Traversal, {

    /**
      Type definition.

      @property type
      @type {String}
      @default "charter/state"
      @final
    */
    type: 'charter/state',

    /**
      A value indicating that this is a state object.

      @property hasContext
      @type {Boolean}
      @default true
      @final
    */
    isState: true,

    /**
      Initialize a state and configure its hierarchy.

      @method init
      @private
      @param config {Object} The state configuration.
    */
    init: function (config) {

      /**
        Unique identifier.

        @property id
        @type {Integer}
        @final
      */
      this.id = Util.id();

      /**
        Name of this state.  States which have been assigned as children
        to another state will automatically be named the key they were
        stored under.

        @property name
        @type {String}
        @default "state"
      */
      this.name = 'state';

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
        @default null
      */
      this.parentState = null;

      /**
        Default transition method.

        @method setup
        @param machine {Machine} state machine invoking the transition
        @param context {Object} context object for this state
        @see Machine#transitionEvent
      */
      this.setup = Util.noop;

      /**
        This method fires when the state is entered.

        @method enter
        @param machine {Machine} state machine invoking the transition
      */
      this.enter = Util.noop;

      /**
        This method fires when the state is exited.

        @method exit
        @param machine {Machine} state machine invoking the transition
      */
      this.exit = Util.noop;

      /**
        A hash containing all child states.

        @property states
        @type {Object}
        @default {}
      */
      this.states = {};

      /**
        A cache holding transition sets required to move from one
        state to another *populated by Machine#getTransitions.*

        @property pathsCache
        @type {Object}
        @default {}
      */
      this.pathsCache = {};

      // Build State Chart
      this.buildChart(config);

      // Apply configuration values to instance.
      Util.extend(this, config);

      /**
        A value indicating if this is a leaf in a state hierarchy.
        False if it has any child states, true otherwise.

        @property isLeaf
        @type {Boolean}
      */
      this.isLeaf = Util.emptyObject(this.states);
    },

    /**
      Extract and initialize a state chart from a configuration object.

      @method buildChart
      @private
      @param config {Object} The state configuration.
    */
    buildChart: function (config) {
      var states = config.states||{};
      var prop, item;

      // Initialize all states in states hash
      for (prop in states) {
        item = states[prop];
        if(states.hasOwnProperty(prop)) {
          this.setupChild(prop, item);
        }
      }

      // Initialize any state that is a property and remove it from config
      for (prop in config) {
        item = config[prop];
        if(config.hasOwnProperty(prop)) {
          if (item.isState) {
            states[prop] = this.setupChild(prop, item);
            delete config[prop];
          }
        }
      }

      config.states = states;
    },

    /**
      Initialize a child state.

      @method setupChild
      @param name {String} The name of the state being set up.
      @param child {State} An instance of Charter.State to be configured.
    */
    setupChild: function (name, child) {
      // Give child a reference to its parent.
      child.parentState = this;

      // Name child what it was keyed on in the parent.
      child.name = name;

      return child;
    },

    /**
      The full path to this state, taking all parentStates into account.

      @method path
      @type String
    */
    path: Traversal.computed(function () {
      if (this.parentState && this.parentState.isState) {
        return this.parentState.path()+'.'+this.name;
      } else {
        return this.name;
      }
    })
  });

  return State;
});
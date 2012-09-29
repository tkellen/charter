define(function (require) {

  'use strict';

  var Util = require('charter/utils');
  var Traversal = require('charter/traversal');

  /**
    Finite state chart building block.

    @class State
    @module Charter
    @extends Traversal
  */
  var State = function (config) {

    /**
      Unique identifier.

      @property id
      @type {Integer}
      @final
    */
    this.id = Util.uniqueId();

    /**
      Name of this state.  States which have been assigned as children
      to another state will automatically be named the key they were
      stored under.

      @property name
      @type {String}
      @default "state"
    */
    this.name = config.name||'state';

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
    this.pathsCacheNoContext = {};
    this.eventTransitions = {};

    // Initialize child states.
    this.init(config);

    /**
      A value indicating if this is a leaf in a state hierarchy.
      False if it has any child states, true otherwise.

      @property isLeaf
      @type {Boolean}
    */
    this.isLeaf = Util.emptyObject(this.states);

  };

  /**
    Create a State hierarchy.

    @method create
    @static
    @param config {Object} The state configuration.
    @return {State} An instance of Charter.State.
  */
  State.create = function () {
    // combine all arguments into a single object
    Array.prototype.unshift.call(arguments, {});
    var config = Util.extend.apply(this, arguments);
    return new State(config);
  };

  State.prototype = {

    /**
      Type definition.

      @property type
      @type {String}
      @default "charter/machine"
      @final
    */
    type: 'charter/state',

    /**
      Initialize a state and configure its hierarchy.

      @method init
      @private
      @param config {Object} The state configuration.
    */
    init: function (config) {
      var name, value, states;

      states = {};

      // Setup explicitly defined child states.
      this.states = config.states||{};
      for (name in this.states) {
        this.setupChild(states, name, this.states[name]);
      }

      // Apply configuration and setup any properties that were states.
      Util.applyConfig(this, config, function(key, val) {
        if (val.type === "charter/state") {
          this.setupChild(states, key, val);
          delete this[key];
        }
      });

      // Assign states hash.
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

      // Give child a reference to its parent.
      child.parentState = this;

      // Name child what it was keyed on in the parent.
      child.name = name;

      // Assign to states hash.
      states[name] = child;
    },

    /**
      The full path to this state, taking all parentStates into account.

      @method path
      @type String
    */
    path: Traversal.computed(function () {
      if (this.parentState && this.parentState.type === "charter/state") {
        return this.parentState.path()+'.'+this.name;
      } else {
        return this.name;
      }
    })
  };

  return Traversal.mixin(State);
});
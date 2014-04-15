define(function (require) {

  'use strict';

  var Util = require('charter/util');
  var State = require('charter/state');
  var Traversal = require('charter/traversal');
  var Transition = require('charter/transition');

  /**
    Manage your State hierarchies.

    @class Machine
    @module Charter
    @extends Traversal
  */
  var Machine = function (config) { this.init(config); };

  /**
    Create a State Machine.

    @method create
    @static
    @param config {Object} The machine's configuration.
    @return {Machine} An instance of Charter.Machine.
  */
  Machine.create = Util.creator(Machine);

  Machine.prototype = Util.extend({}, Traversal, {

    /**
      Type definition.

      @property type
      @type {String}
      @default "charter/machine"
      @final
    */
    type: 'charter/machine',

    buildChart: State.prototype.buildChart,
    setupChild: State.prototype.setupChild,
    path: State.prototype.path,

    /**
      The initial state.  If not defined, the Machine will
      look for a state named 'start' to fill it when calling
      init.

      @property initialState
      @type {String}
    */
    initialState: null,

    /**
      A reference to the Machine's current state.

      @property currentState
      @type {State}
    */
    currentState: null,

    /**
      Raise an exception if an event is sent that cannot be
      handled by the current state or any of its parents.

      @property errorOnUnhandledEvents
      @type Boolean
      @default true
    */
    errorOnUnhandledEvent: true,

    /**
      The method called on the state when it is entered.

      @property transitionEvent
      @type {String}
      @default 'setup'
    */
    transitionEvent: 'setup',

    /**
      A value indicating if logging will occur during transitions.

      @property enableLogging
      @type {Boolean}
      @default false
    */
    enableLogging: false,

    /**
      Initialize a State Machine and configure its hierarchy.

      @method init
      @private
      @param config {Object} The machine configuration.
    */
    init: function (config) {

      /**
        A hash containing all child states by name.

        @property states
        @type {Object}
        @default {}
      */
      this.states = {};

      /**
        An array containing all child states.

        @property childStates
        @type {Array}
        @default []
      */
      this.childStates = [];

      // Build State Chart
      this.buildChart(config);

      // Apply configuration values to instance.
      Util.extend(this, config);

      // Retrieve the initial state of the machine.
      var initialState = this.initialState;

      // If no initial state was found, look for a child state named start.
      if (!initialState && this.states.start) {
        initialState = 'start';
      }

      // Transition to initial state or faile if none was found.
      if (initialState) {
        this.initialState = initialState;
        this.transitionTo(initialState);
      } else {
        throw new Error("Cannot create without an initial state.");
      }
    },

    /**
      Returns a dot notated string representing the current state's path.

      @method currentPath
      @type String
    */
    currentPath: Util.computed(function () {
      return this.currentState.path();
    }),

    /**
      Find a state by its dot-notated path.

      @method getStateByPath
      @type {State}
      @param root {State} the state to start searching from
      @param path {String} the state path to follow
      @return {State} the state at the end of the path
    */
    getStateByPath: function (root, path) {
      var parts = path.split('.');
      var state = root;

      if (!path || path === '') {
        return undefined;
      }

      for (var i=0, len=parts.length; i<len; i++) {
        state = state.states[parts[i]];
        if (!state) { break; }
      }

      return state;
    },

    /**
      Return an array of all states within a dot-notated path.

      @method getStatesInPath
      @type {Array}
      @param root {State} the origin to search from
      @param path {String} the path to find states on
    */
    getStatesInPath: function(root, path) {
      var parts = path.split('.');
      var result = [];
      var state, states;

      if (!path || path === '') {
        return undefined;
      }

      for (var i=0, len=parts.length; i<len; i++) {
        states = root.states;
        if (!states) { return undefined; }

        state = states[parts[i]];
        if (state) {
          root = state;
          result.push(state);
        } else {
          return undefined;
        }
      }

      return result;
    },

    /**
      Before transitioning into a new state, the current state must be
      exited.  Because the Machine can invoke transitions between states
      which are separated by multiple nodes, this method determines which
      state(s) to exit / enter in order to complete a transition.

      @method getTransitions
      @type {Object}
      @param path {String} dot notated string indicating the destination
    */
    getTransitions: function (path) {

      // Where will we transition from?
      var currentState = this.currentState||this;

      // If a transition from this state to the destination has already occured
      // during the lifecycle of this statemachine, it has been cached and can
      // be returned immediately.
      if(currentState !== this) {
        var cache = currentState.pathsCache[path];
        if (cache) {
          return cache;
        }
      }

      // Begin by assuming that nearest shared parent node is the current state
      var sharedParent = currentState;

      // Array of states that must be exited before entering the destination
      var exitStates = [];

      // For the following:
      //
      //   |- root
      //   | |- post
      //   | | |- show (* current)
      //   | |- comments
      //   | | |- show
      //
      // Given a transition to `comments.show`, try locating it relative to the
      // sharedParent (the current state, `root.posts.show`).  For the example,
      // this would attempt to find the state `root.posts.show.comments.show`
      var enterStates = this.getStatesInPath(sharedParent, path);

      // Assuming the destination state wasn't found relative to the current
      // state, traverse up the chart, trying each parent as the relative
      // starting position until the correct one is found.
      while (sharedParent && !enterStates) {

        // Save each state that must be exited to reach the sharedParent
        exitStates.unshift(sharedParent);

        // Are you my shared parent?
        sharedParent = sharedParent.parentState;

        // If no parent was found, we're at the top of the hierarchy
        if (!sharedParent) {
          // Look relative to the entire state machine
          enterStates = this.getStatesInPath(this, path);
          if (!enterStates) {
            throw new Error('Could not find state for path: "'+path+'"');
          }
        } else {
          // Try locating transition destination relative to the new
          // shared parent.  Given a transition to `comments.show`,
          // this will return undefined until the sharedParent has
          // reached `root`
          enterStates = this.getStatesInPath(sharedParent, path);
        }
      }

      // Given a transition to `comments.show`, we would now have:
      //   sharedParent: `root`
      //   enterStates: [`root.comments`, `root.comments.show`]
      //   exitStates: [`root.posts`, `root.posts.show`]
      //
      // Given a transition to `root.comments.show`, we would now have:
      //   sharedParent: `root'
      //   enterStates: [`root`,`root.comments`,`root.comments.show`]
      //   exitStates: [`root`,`root.post`,`root.post.show`]
      //
      // Any states shared by enter/exit are unnecessary transitions,
      // the following code removes them.
      while (enterStates.length > 0 && enterStates[0] === exitStates[0]) {
        sharedParent = enterStates.shift();
        exitStates.shift();
      }

      // Prepare transition hash.
      var transitions = {
        exitStates: exitStates,
        enterStates: enterStates,
        sharedParent: sharedParent
      };

      // Cache the results for transferring to the defined `path`.
      if(currentState !== this) {
        currentState.pathsCache[path] = transitions;
      }

      return transitions;
    },

    /**
      Request a transition into another state.

      @method transitionTo
      @param path {String} a dot notated path to a destination state
      @param [context]* {Object} the context to pass into each state
    */
    transitionTo: function (path, context) {

      if(!path || path === '') {
        return;
      }

      // Read multiple contexts from arguments
      var contexts = context ? Array.prototype.slice.call(arguments, 1) : [];

      // Determine which states must be entered and exited to reach
      // the destination state.
      var hash = this.getTransitions(path);

      // Process the transitions, adding contexts where nessesary
      var transition = new Transition(hash).normalize(this, contexts);

      //
      this.enterState(transition);

      this.triggerSetupContext(transition);

      return this;
    },

    /**
      Move from one state to another.

      @method enterState
      @private
      @param transition {Transition} a transition object
    */
    enterState: function (transition) {
      var i, len;
      var log = this.enableLogging;
      var exitStates = transition.exitStates.slice();
      var enterStates = transition.enterStates.slice();

      // Exit states up to the shared parent.
      for(i=exitStates.length-1; i>-1; i--) {
        if (log) {
          console.log("Exiting: "+exitStates[i].path());
        }
        exitStates[i].exit(this);
      }

      // Enter states down to the destination.
      for(i=0, len=enterStates.length; i<len; i++) {
        if (log) {
          console.log("Entering: "+enterStates[i].path());
        }
        enterStates[i].enter(this);
      }

      // We've arrived!
      this.currentState = transition.finalState;
    },

    /**
      Call transition method for each state in a transition, passing
      in the correct context.

      @method triggerSetupContext
      @private
      @param transition {Transition} a transition object
    */
    triggerSetupContext: function (transition) {
      var contexts = transition.contexts;
      var offset = transition.enterStates.length - contexts.length;
      var enterStates = transition.enterStates;
      var transitionEvent = this.transitionEvent;

      if (offset < 0) {
       throw new Error("More contexts provided than states.");
      }
      for(var i=0, len=enterStates.length; i<len; i++) {
        enterStates[i][transitionEvent](this, contexts[i-offset]);
      }
    },

    send: function (event, context) {
      this.sendRecursively(event, this.currentState, context);
    },

    sendRecursively: function (event, state, context) {
      var log = this.enableLogging;
      var action = state[event];
      var parentState;

      if (typeof action === 'function') {
        if (log) {
          console.log('Sending event '+event+' to '+this.currentPath());
        }
        return action.call(state, this, context);
      } else if ((parentState = state.parentState)) {
        return this.sendRecursively(event, parentState, context);
      } else if (this.errorOnUnhandledEvent) {
        throw new Error('Could not respond to event '+event+' in state '+this.currentPath()+'.');
      }
    }
  });

  return Machine;
});

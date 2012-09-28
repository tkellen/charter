define(function (require) {

  'use strict';

  var Util = require('charter/utils');
  var State = require('charter/state');
  var Traversal = require('charter/traversal');
  var Transition = require('charter/transition');

  /**
    Manage your State hierarchies.

    @class State
    @module Charter
    @extends Traversal
  */
  var Machine = function (config) {

    /**
      A reference to the Machines's current state.

      @property currentState
      @type {State}
    */
    this.currentState = null;

    /**
      The initial state, defined as a dot-notated path or an instance
      of Charter.State.  If not defined, the Machine will look for a
      state named 'start' to fill it.

      @property initialState
      @type {State|String}
    */
    this.initialState = null;

    /**
      The event the transition will call when entering a state.

      @property transitionEvent
      @type {String}
      @default 'setup'
    */
    this.transitionEvent = 'setup';

    /**
      Determines if State Machine will log entering states to console.

      @property enableLogging
      @type {Boolean}
      @default false
    */
    this.enableLogging = false;

    /**
      A hash containing all child states of this state.

      @property states
      @type {Object}
      @default {}
    */
    this.states = {};

    this.init(config);
  };

  /**
    Convenience method to create a Machine.

    @method create
    @static
    @param config {Object} The chart configuration.
    @return {Chart} An instance of Charter.Machine.
  */
  Machine.create = function () {
    Array.prototype.unshift.call(arguments, {});
    var config = Util.extend.apply(this, arguments);
    return new Machine(config);
  };

  Machine.prototype = {

    type: 'charter/machine',

    setupChild: State.prototype.setupChild,
    path: State.prototype.path,

    init: function (config) {
      State.prototype.init.call(this, config);

      // get initialState (if any)
      var initialState = this.get('initialState');

      // if no initial state was found and there
      // is a substate titled start, use that.
      if (!initialState && this.states.start) {
        initialState = 'start';
      }
      if (initialState) {
        this.transitionTo(initialState);
        this.set('initialState', initialState);
      } else {
        throw new Error("Cannot create without an initial state.");
      }
    },

    /**
      Returns a dot notated string representing the current state's path.

      @method currentPath
      @type String
    */
    currentPath: Traversal.computed(function () {
      return this.currentState.path();
    }),

    /**
      Find a state by its dot-notated path.

      @method getStateByPath
      @type {State}
      @param {State} root the state to start searching from
      @param {String} path the state path to follow
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
      @param {State|Machine} root the origin to search from
      @param {String} path the path to find states on
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

       Sample State Hierarchy (used in comments below)

        |- root
        | |- post
        | | |- show (* current)
        | |- comments
        | | |- show

      @method getTransitions
      @type {Object}
      @param {State} the state to transition from
      @param {String} a dot notated string indicating the destination
    */
    getTransitions: function (path) {

      // Where will we transition from?
      var currentState = this.currentState||this;

      /**
        If a transition from the currentState into the specified path has already
        occured, return the result immediately from cache.
      */
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

      /**
        Given a transition to `comments.show`, try locating it relative to the
        sharedParent (the current state, `root.posts.show`).  For the example,
        this would attempt to find the state `root.posts.show.comments.show`
      */
      var enterStates = this.getStatesInPath(sharedParent, path);

      /**
        Assuming the destination state wasn't found relative to the current
        state, traverse up the chart, trying each parent as the relative
        starting position until the correct one is found.
      */
      while (sharedParent && !enterStates) {

        // Save each state that must be exited to reach the sharedParent
        exitStates.unshift(sharedParent);

        // Are you my shared parent?
        sharedParent = sharedParent.parentState;

        // If there are no parents ???
        if (!sharedParent) {
          enterStates = this.getStatesInPath(this, path);
          if (!enterStates) {
            throw new Error('Could not find state for path: "'+path+'"');
          }
        }

        /**
          Try locating transition destination relative to the new shared
          parent.  Given a transition to `comments.show`, this will return
          undefined until the sharedParent has reached `root`
        */
        enterStates = this.getStatesInPath(sharedParent, path);
      }

      /**
        Given a transition to `comments.show`, we would now have:

        sharedParent: `root`
        enterStates: [`root.comments`, `root.comments.show`]
        exitStates: [`root.posts`, `root.posts.show`]

        Given a transition to `root.comments.show`, we would now have:

          sharedParent: `root'
          enterStates: [`root`,`root.comments`,`root.comments.show`]
          exitStates: [`root`,`root.post`,`root.post.show`]

        Any states shared by enter/exit are unnecessary transitions,
        the following code removes them.
      */
      while (enterStates.length > 0 && enterStates[0] === exitStates[0]) {
        sharedParent = enterStates.shift();
        exitStates.shift();
      }

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


    transitionTo: function (path, context) {
      // Read multiple contexts from arguments
      var contexts = context ? Array.prototype.slice.call(arguments, 1) : [];

      // Get the enter, exit and resolve states for the current state and specified path.
      var hash = this.getTransitions(path);

      // Next, process the raw state information for the contexts passed in.
      var transition = new Transition(hash).normalize(this, contexts);

      this.enterState(transition);

      this.triggerSetupContext(transition);

      return this;
    },

    enterState: function(transition) {
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

    triggerSetupContext: function(transition) {
      var contexts = transition.contexts;
      var offset = transition.enterStates.length - contexts.length;
      var enterStates = transition.enterStates;
      var transitionEvent = this.transitionEvent;

      if (offset < 0) {
       throw new Error("More contexts provided than states.");
      }

      for(var i=0, len=enterStates.length; i>0; i++) {
        enterStates[i][transitionEvent](this, contexts[i-offset]);
      }
    }
  };

  return Traversal.mixin(Machine);
});
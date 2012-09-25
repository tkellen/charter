define(function (require) {

  'use strict';

  var Mixin = require('charter/mixin');
  var State = require('charter/state');
  var Transition = require('charter/transition');

  var StateChart = function (config) {

    config = config||{};

    /**
      A reference to the Chart's current state.

      @property currentState
      @type {Charter.State}
    */
    this.currentState = null;

    /**
      The initial state, defined as a dot-notated path or an instance
      of Charter.State.  If not defined, the Chart will look for a
      state named 'start' to fill it.

      @property initialState
      @type {Charter.State|String}
    */
    this.initialState = null;

    /**
      A hash containing all child states of this state.

      @property states
      @type {Object}
      @default {}
    */
    this.states = {};

    this.init(config);
  };

  StateChart.create = function (config) { return new StateChart(config); };

  StateChart.prototype = {

    type: "charter/chart",

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
      }
    },

    /**
      Returns a dot notated string representing the current state's path.

      @method currentPath
      @type String
    */
    currentPath: Mixin.computed(function () {
      return this.currentState.path();
    }),

    /**
      Find a state by its dot-notated path.

      @method getStateByPath
      @param {Charter.State} root the state to start searching from
      @param {String} path the state path to follow
      @return {Charter.State} the state at the end of the path
    */
    getStateByPath: function (root, path) {
      var parts = path.split('.');
      var state = root;

      if (!path || path === "") {
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
      @type array
      @param origin
      @param path
    */
    getStatesInPath: function(root, path) {
      var parts = path.split('.');
      var result = [];
      var state, states;

      if (!path || path === "") {
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
      exited.  Because the StateChart can invoke transitions between
      states that are separated by multiple nodes, this method is used
      to determine which state(s) to exit / enter in order to complete
      a transition.

      Sample Chart (used in comments below)

        |- root
        | |- post
        | | |- show (* current)
        | |- comments
        | | |- show

      @method getTransitions
      @type Object
      @param {Charter.State} the state to transition from
      @param {String} a dot notated string indicating the destination
    */
    getTransitions: function (currentState, path) {

      // If a transition from the current state to destination path has
      // already occured, return result immediately from cache
      var cache = currentState.pathsCache[path];
      if (cache) {
        return cache;
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

      // Cache the results for the current state and the `path`.
      var transitions = currentState.pathsCache[path] = {
        exitStates: exitStates,
        enterStates: enterStates,
        sharedParent: sharedParent
      };

      // Return them
      return transitions;
    },


    transitionTo: function (path, context) {
      // read multiple contexts from arguments
      var contexts = context ? Array.prototype.slice.call(arguments, 1) : [];

      // get current state
      var currentState = this.currentState;

      // Get the enter, exit and resolve states for the current state and specified path.
      var hash = this.getTransitions(currentState, path);

      // Next, process the raw state information for the contexts passed in.
      var transition = new Transition(hash).normalize(this, contexts);

      //this.enterState(transition);
      //this.triggerSetupContext(transition);
    }
  };


  return Mixin.Traversal(StateChart);
});
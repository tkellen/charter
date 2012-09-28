define(function (require) {

  'use strict';

  /**
    Normalizes enter, exit and shared parent states for a transition.

    @class Transition
    @private
  */
  var Transition = function (config) {
    this.init(config||{});
  };

  /**
    Convenience method to create a Transition.

    @method create
    @static
    @param config {Object} The state configuration.
    @return {Transition} A transition object.
  */
  Transition.create = function (config) { return new Transition(config); };

  Transition.prototype = {

    type: 'charter/transition',

    init: function (config) {
      this.enterStates = config.enterStates.slice();
      this.exitStates = config.exitStates.slice();
      this.sharedParent = config.sharedParent;
      this.finalState = config.enterStates[config.enterStates.length - 1] || config.sharedParent;
      this.contexts = [];
    },

    /**
      Normalize the passed in enter, exit and resolve states.

      @method normalize
      @param {Ember.StateManager} manager the state manager running the transition
      @param {Array} contexts a list of contexts passed into `transitionTo`
    */
    normalize: function (machine, contexts) {
      this.matchContextsToStates(contexts);
      this.addInitialStates();
      this.removeUnchangedContexts(machine);
      return this;
    },

    /**
      Prepare a list of contexts to be applied to each state in a transition.

      @method matchContextsToStates
      @param {Array} contexts a list of contexts passed from `transitionTo`
    */
    matchContextsToStates: function (contexts) {
      var stateIdx = this.enterStates.length - 1,
          matchedContexts = [],
          state,
          context;

      /**
        This will iterate through the provided contexts, preparing an
        array that is ordered to match the enterStates array.  If any
        contexts remain when enterStates run out, add parent states.

        If any contexts remain when the top of the state hierarchy is
        reached (the State Machine itself), raise an exception.

        For the following:

          |- root
          | |- post
          | | |- index
          | | |- comments
          | |- about (* current state)

        A call to `transitionTo('post.comments', post, post.get('comments')`,
        will assign the first context (`post`) to `root.post`, and the second
        context (`post.get('comments')`) to `root.post.comments`.

        For the following:

          |- root
          | |- post
          | | |- index (* current state)
          | | |- comments
          | | |- about

        A call to `transitionTo('post.comments', altPost, altPost.get('comments')`,
        the `<root.post>` state will be added to the list of enter and exit states
        because its context has changed.
      */
      while (contexts.length > 0) {
        if (stateIdx >= 0) {
          state = this.enterStates[stateIdx--];
        } else {
          if (this.enterStates.length) {
            state = this.enterStates[0].parentState;
            if (!state) {
              throw new Error('Cannot match all contexts to states.');
            }
          } else {
            // If re-entering the current state with a context, the shared
            // parent state will be the current state.
            state = this.sharedParent;
          }
          this.enterStates.unshift(state);
          this.exitStates.unshift(state);
        }

        // Skip over states that don't take a context.
        if (state.hasContext) {
          context = contexts.pop();
        } else {
          context = null;
        }

        matchedContexts.unshift(context);
      }

      this.contexts = matchedContexts;
    },

    /**
      Add any `initialState`s to the list of enter states.

      @method addInitialStates
    */
    addInitialStates: function() {
      var finalState = this.finalState;
      var initialState;

      while(true) {
        initialState = finalState.initialState||'start';
        finalState = finalState.states[initialState];

        if (!finalState) { break; }

        this.finalState = finalState;
        this.enterStates.push(finalState);
        this.contexts.push(undefined);
      }
    },

    /**
      Remove any states that were added because the number of contexts
      exceeded the number of explicit enter states, but the context has
      not changed since the last time the state was entered.

      @method removeUnchangedContexts
      @param {Machine} machine passed to find last context for a state
    */
    removeUnchangedContexts: function(machine) {
      // Start from the beginning of the enter states. If the state was added
      // to the list during the context matching phase, make sure the context
      // has actually changed since the last time the state was entered.
      while (this.enterStates.length > 0) {
        if (this.enterStates[0] !== this.exitStates[0]) { break; }

        if (this.enterStates.length === this.contexts.length) {
          if (machine.getStateMeta(this.enterStates[0], 'context') !== this.contexts[0]) { break; }
          this.contexts.shift();
        }

        this.parentState = this.enterStates.shift();
        this.exitStates.shift();
      }
    }

  };

  return Transition;
});
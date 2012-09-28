define (require) ->

  State = require('charter/state')
  Machine = require('charter/machine')
  window.utils = require('charter/utils')

  describe 'Machine', ->

    beforeEach ->
      stateEvents =
        entered: 0
        enter: -> @entered++

        exited: 0
        exit: -> @exited++;

        reset: ->
          @entered = 0;
          @exited = 0;

        setup: (machine, context) ->
          console.log('setting up',this.path(),'with',machine,context)

      @machine = Machine.create
        enableLogging: true
        initialState: 'root'
        root: State.create(stateEvents, {
          states:
            comments: State.create(stateEvents, {
              show: State.create(stateEvents)
            })
          post: State.create(stateEvents, {
            create: State.create(stateEvents)
            edit: State.create(stateEvents)
            show: State.create(stateEvents)
          })
        })
      window.machine = @machine

    describe 'create', ->

      it 'should return a statemachine object', ->
        expect(@machine.type).toEqual('charter/machine')

      it 'should discover states that are properties and add them to states hash', ->
        expect(@machine.states.root).toBeDefined()

      it 'should discover states that are set in the states property', ->
        expect(@machine.states.root.states.comments).toBeDefined()

      it 'should throw when creating without an initialState', ->
        expect(->Machine.create()).toThrow(new Error('Cannot create without an initial state.'))

    describe 'getStateByPath', ->

      it 'should allow retreival by dot-notated path', ->
        expect(@machine.getStateByPath(@machine, 'root.post')).toEqual(@machine.states.root.states.post)

    describe 'getStatesInPath', ->

      it 'should return an array of every state within a dot-notated path', ->
        result = [
          @machine.states.root,
          @machine.states.root.states.post,
          @machine.states.root.states.post.states.show
        ]
        expect(@machine.getStatesInPath(@machine, 'root.post.show')).toEqual(result)

    describe 'currentState', ->

      it 'should be set on machine creation to any state named start', ->
        machine = Machine.create
          start: State.create()
        expect(machine.currentState).toEqual(machine.states.start)

      it 'should be set on machine creation to a state maching initialState', ->
        expect(@machine.currentState).toEqual(machine.states.root)

    describe 'currentPath', ->

      it 'should return the path of the currentState', ->
        expect(@machine.currentPath()).toEqual('root')

    describe 'getTransitions', ->

      beforeEach ->
        @machine.transitionTo('root.post.show')
        @transition = @machine.getTransitions('comments.show')

      it 'should find shared parent node for a transition', ->
        expect(@transition.sharedParent).toEqual(@machine.states.root)

      it 'should find the states needed to exit during a transition', ->
        expect(@transition.exitStates[0]).toEqual(@machine.states.root.states.post)
        expect(@transition.exitStates[1]).toEqual(@machine.states.root.states.post.states.show)

      it 'should find the states needed to enter during a transition', ->
        expect(@transition.enterStates[0]).toEqual(@machine.states.root.states.comments)
        expect(@transition.enterStates[1]).toEqual(@machine.states.root.states.comments.states.show)

      it 'should accept relative paths', ->
        transition = @machine.getTransitions('comments')
        expect(transition.enterStates[transition.enterStates.length-1]).toEqual(@machine.states.root.states.comments)

      it 'should accept absolute paths', ->
        transition = @machine.getTransitions('root.comments')
        expect(transition.exitStates[0]).toEqual(@machine.states.root.states.post)
        expect(transition.exitStates[1]).toEqual(@machine.states.root.states.post.states.show)
        expect(@transition.enterStates[0]).toEqual(@machine.states.root.states.comments)
        expect(@transition.enterStates[1]).toEqual(@machine.states.root.states.comments.states.show)

    describe 'transitionTo', ->

      beforeEach ->
        @postState = @machine.states.root.states.post
        @postCreateState = @machine.states.root.states.post.states.create
        @postState.reset();
        @postCreateState.reset();

      it 'should update the currentState after a transition', ->
        @machine.transitionTo('root.comments')
        expect(@machine.currentState).toEqual(machine.states.root.states.comments)

      it 'should trigger enter methods on states entered during transition', ->
        @machine.transitionTo('post.create')
        expect(@postState.entered).toEqual(1)
        expect(@postCreateState.entered).toEqual(1)

      it 'should trigger enter and exit methods on states during a transition', ->
        @machine.transitionTo('post.create')
        expect(@postState.entered).toEqual(1)
        expect(@postCreateState.entered).toEqual(1)

        @machine.transitionTo('root.comments')
        expect(@postState.exited).toEqual(1)
        expect(@postCreateState.exited).toEqual(1)

      it 'should transition to the deepest initialState', ->
        machine = Machine.create
                    initialState: 'root'
                    root: State.create
                      start: State.create()
        expect(machine.currentState).toEqual(machine.states.root.states.start)


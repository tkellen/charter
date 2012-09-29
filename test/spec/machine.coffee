define (require) ->

  State = require('charter/state')
  Machine = require('charter/machine')

  describe 'Machine', ->

    beforeEach ->
      enteredOrder = 0;
      exitedOrder = 0;
      passedArgument = null;
      stateEvents =

        setupCalls: 0
        setup: (machine, context) ->
          @setupCalls++;
          @setupContext = context

        enterCalls: 0
        enteredOrder: 0
        enter: ->
          @enterCalls++
          @enterOrder = ++enteredOrder

        exitCalls: 0
        exitedOrder: 0
        exit: ->
          @exitCalls++;
          @exitOrder = ++exitedOrder

        reset: ->
          @setupContext = null
          @enterCalls = 0
          @exitCalls = 0
          @setupCalls = 0
          @eventCalls = 0
          @enterOrder = 0
          @exitOrder = 0
          @passedArgument = null
          @passedArguments = null

      @machine = window.machine = Machine.create
        initialState: 'root'
        root: State.create(stateEvents, {
          states:
            comments: State.create(stateEvents, {
              show: State.create(stateEvents)
            })
          grandparent: State.create(stateEvents, {
            event: (machine, arg1, arg2) ->
              @eventCalls++
              @passedArgument = arg1
              @passedArguments = arguments
            parent: State.create(stateEvents, {
              child: State.create(stateEvents, {
                event: (machine, arg1, arg2) ->
                  @eventCalls++
                  @passedArgument = arg1
                  @passArguments = arguments
                })
              sibling: State.create(stateEvents)
            })
          })
        })
        resetTo: (initial) ->
          @getStateByPath(this, 'root').reset()
          @getStateByPath(this, 'root.comments').reset()
          @getStateByPath(this, 'root.comments.show').reset()
          @getStateByPath(this, 'root.grandparent').reset()
          @getStateByPath(this, 'root.grandparent.parent').reset()
          @getStateByPath(this, 'root.grandparent.parent.child').reset()
          @getStateByPath(this, 'root.grandparent.parent.sibling').reset()
          @transitionTo(initial)
          enteredOrder = 0
          exitedOrder = 0


      @root = @machine.states.root
      @comments = @root.states.comments
      @commentsShow = @comments.states.show
      @grandParent = @root.states.grandparent
      @parent = @grandParent.states.parent
      @child = @parent.states.child
      @sibling = @parent.states.sibling

    describe 'create', ->

      it 'should return a statemachine object', ->
        expect(@machine.type).toEqual('charter/machine')

      it 'should combine all arguments into a single configuration object', ->
        machine = Machine.create({initialState:'first'},{first:State.create()},{second:'test'},{third:'test'})
        expect(machine.states.first).toBeDefined()
        expect(machine.second).toBeDefined()
        expect(machine.third).toBeDefined()

      it 'should discover states that are properties and add them to states hash', ->
        expect(@root).toBeDefined()

      it 'should discover states that are set in the states property', ->
        expect(@comments).toBeDefined()

      it 'should throw when creating without an initialState or state named start', ->
        expect(->Machine.create()).toThrow(new Error('Cannot create without an initial state.'))

      it 'should automatically enter the state specified in initialState', ->
        expect(@machine.currentState).toEqual(@root)

    describe 'currentState', ->

      it 'should be set on machine creation to any state named start', ->
        machine = Machine.create
          start: State.create()
        expect(machine.currentState).toEqual(machine.states.start)

    describe 'currentPath', ->

      it 'should return the path of the currentState', ->
        expect(@machine.currentPath()).toEqual('root')

    describe 'getStateByPath', ->

      it 'should allow retreival by dot-notated path', ->
        expect(@machine.getStateByPath(@machine, 'root.grandparent')).toEqual(@grandParent)

    describe 'getStatesInPath', ->

      it 'should return an array of every state within a dot-notated path', ->
        result = [@root, @grandParent, @parent]
        expect(@machine.getStatesInPath(@machine, 'root.grandparent.parent')).toEqual(result)

    describe 'getTransitions', ->

      it 'should find shared parent node for a transition', ->
        @machine.transitionTo('root.grandparent.parent')
        transition = @machine.getTransitions('comments.show')
        expect(transition.sharedParent).toEqual(@root)

      it 'should find the states needed to exit during a transition', ->
        @machine.transitionTo('root.grandparent.parent')
        transition = @machine.getTransitions('comments.show')
        exitStates = [@grandParent, @parent]
        expect(transition.exitStates).toEqual(exitStates)

      it 'should find the states needed to enter during a transition', ->
        @machine.transitionTo('root.grandparent.parent')
        transition = @machine.getTransitions('comments.show')
        expect(transition.enterStates).toEqual([@comments, @commentsShow])

      it 'should accept relative paths', ->
        @machine.transitionTo('root.grandparent.parent')
        transition = @machine.getTransitions('comments')
        expect(transition.enterStates[transition.enterStates.length-1]).toEqual(@comments)

      it 'should accept absolute paths', ->
        @machine.transitionTo('root.grandparent.parent')
        transition = @machine.getTransitions('root.comments.show')
        expect(transition.enterStates).toEqual([@comments, @commentsShow])
        expect(transition.exitStates).toEqual([@grandParent, @parent])

    describe 'transitionTo', ->

      beforeEach ->
        @machine.resetTo('root')

      it 'should update the currentState after a transition', ->
        @machine.transitionTo('root.comments')
        expect(@machine.currentState).toEqual(@comments)

      it 'should trigger enter and exit methods on states during a transition', ->
        @machine.transitionTo('grandparent.parent')
        expect(@parent.enterCalls).toEqual(1)
        expect(@grandParent.enterCalls).toEqual(1)

        @machine.transitionTo('root.comments')
        expect(@parent.exitCalls).toEqual(1)
        expect(@grandParent.exitCalls).toEqual(1)

      it 'should exit states in the correct order when transitioning', ->
        @machine.resetTo('root.grandparent.parent')
        @machine.transitionTo('root')
        expect(@parent.exitOrder).toEqual(1)
        expect(@grandParent.exitOrder).toEqual(2)

      it 'should enter states in the correct order when transitioning', ->
        @machine.resetTo('grandparent.parent')
        @machine.transitionTo('comments.show')
        expect(@comments.enterOrder).toEqual(1)
        expect(@commentsShow.enterOrder).toEqual(2)

      it 'should trigger transitionEvent on states entered', ->
        @machine.transitionTo('grandparent.parent')
        expect(@grandParent.setupCalls).toEqual(1)
        expect(@parent.setupCalls).toEqual(1)

      it 'should transition to the deepest initialState if target state has one', ->
        machine = Machine.create
                    initialState: 'root'
                    root: State.create
                      start: State.create()
        expect(machine.currentState).toEqual(machine.states.root.states.start)

      it 'should do nothing if transitioning into the current state without a new context', ->
        @machine.transitionTo('root')
        expect(@root.enterCalls).toEqual(0)
        expect(@root.exitCalls).toEqual(0)

      it 'should trigger the destination state\'s setup method with a context if one has been provided', ->
        @machine.resetTo('root')
        @machine.transitionTo('root.grandparent', {test:'context'})
        expect(@grandParent.setupContext).toEqual({test:'context'})

      it 'should trigger the destination state\'s setup method with a context even if the destination is the current state', ->
        @machine.resetTo('root')
        @machine.transitionTo('root', {test:'context'})
        expect(@root.setupContext).toEqual({test:'context'})

    describe 'send', ->

      it 'dispatches events to the current state', ->
        @machine.resetTo('root.grandparent')
        @machine.send('event')
        expect(@machine.currentState.eventCalls).toEqual(1)

      it 'dispatches events to a parent state if the current state does not respond', ->
        @machine.resetTo('root.grandparent.parent')
        @machine.send('event')
        expect(@grandParent.eventCalls).toEqual(1)

      it 'does not dispatch events any further up the hierarchy if one is found', ->
        @machine.resetTo('root.grandparent.parent.child')
        @machine.send('event')
        expect(@grandParent.eventCalls).toEqual(0)

      it 'supports sending arguments to events', ->
        @machine.resetTo('root.grandparent')
        @machine.send('event', { context: true; })
        expect(@grandParent.passedArgument.context).toEqual(true)

      it 'throws an exception if non-existing event is sent and errorOnUnhandledEvent is true', ->
        @machine.resetTo('root.grandparent')
        expect(=>@machine.send('na')).toThrow(new Error('Could not respond to event na in state root.grandparent.'))

      it 'does not throw an exception if non-existing event is sent and errorOnUnhandledEvent is false', ->
        @machine.errorOnUnhandledEvent = false
        expect(=>@machine.send('na')).not.toThrow()

      #to be enabled later
      #it 'supports sending multiple arguments to events', ->
      #  @machine.resetTo('root.grandparent')
      #  @machine.send('event', {first: 'argument'}, {second: 'argument'});
      #  expect(@grandParent.passedArguments.length).toEqual(3)

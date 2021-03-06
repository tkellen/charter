define (require) ->

  State = require('charter/state')

  describe 'State', ->

    describe 'create', ->

      it 'should return a state object', ->
        state = State.create({name:'test'})
        expect(state.type).toEqual('charter/state')

      it 'should combine all arguments into a single configuration object', ->
        state = State.create({first:'test'},{second:'test'})
        expect(state.first).toBeDefined()
        expect(state.second).toBeDefined()

    describe 'isLeaf', ->

      it 'should be true if state has no children', ->
        state = State.create()
        expect(state.isLeaf()).toBe(true)

      it 'should be false if state has children', ->
        state = State.create
          child: State.create()
        expect(state.isLeaf()).toBe(false)

    describe 'path', ->

      it 'should return the full path to this state, taking all parentStates into account.', ->
        state = State.create
          name: 'root'
          child: State.create
            grandChild: State.create()
        expect(state.states.child.states.grandChild.path()).toBe('root.child.grandChild')

    describe 'setupChild', ->

      it 'should assign parentState to children', ->
        state = State.create
          child: State.create()
        expect(state.states.child.parentState).toEqual(state)

      it 'should give substates a name based on the key they were assigned to', ->
        state = State.create
          name: 'root'
          child: State.create()
        expect(state.states.child.path()).toEqual('root.child')

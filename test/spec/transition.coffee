define (require) ->

  State = require('charter/state')
  Machine = require('charter/machine')
  Transition = require('charter/transition')

  describe 'Transition', ->

    beforeEach ->

      @machine = Machine.create
        initialState: 'root'
        root: State.create
          post: State.create
            create: State.create()
            edit: State.create()
            show: State.create()
          comments: State.create
            show: State.create()

      hash = @machine.getTransitions('post.show')
      @transition = Transition.create(hash)

    describe 'create', ->

      it 'should return a transition object', ->
        expect(@transition.type).toEqual('charter/transition')

      it 'should determine the final state of the transition', ->
        expect(@transition.finalState).toEqual(@machine.getStateByPath(@machine.states.root, 'post.show'))

    describe 'matchContextsToStates', ->

      it 'should prepare an array of contexts to match the array of enterStates', ->
        contexts = [{id:'1'},{title:'hello',body:'this is a post body'}]
        @transition.matchContextsToStates(contexts.slice())
        expect(@transition.contexts).toEqual(contexts)

        @machine.states.root.states.post.hasContext = false;
        @transition = Transition.create(@machine.getTransitions('post.show'))
        @transition.matchContextsToStates(contexts.slice())
        expect(@transition.contexts[1]).toEqual(null)
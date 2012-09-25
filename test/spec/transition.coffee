define [

  "charter/state"
  "charter/chart"
  "charter/transition"

],

(State, Chart, Transition) ->

  describe "Transition", ->

    beforeEach ->

      @chart = Chart.create
        root: State.create
          post: State.create
            show: State.create()
          comments: State.create
            show: State.create()

      # this will not be needed when transitions actually work
      initialState = @chart.states.root.states.post.states.show
      hash = @chart.getTransitions(initialState, 'comments.show')
      @transition = Transition.create(hash)

    describe "create", ->

      it "should return a transition object", ->
        expect(@transition.type).toEqual("charter/transition")

      it "should determine the final state of the transition", ->
        expect(@transition.finalState).toEqual(@chart.getStateByPath(@chart.states.root, 'comments.show'))



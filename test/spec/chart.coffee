define [

  "charter/state"
  "charter/chart"

],

(State, Chart) ->

  describe "Chart", ->

    beforeEach ->

      @chart = Chart.create
        root: State.create
          post: State.create
            show: State.create()
          comments: State.create
            show: State.create()

    describe "create", ->

      it "should return a statechart object", ->
        expect(@chart.type).toEqual("charter/chart")

      it "should discover states that are properties and add them to states hash", ->
        expect(@chart.states.root).toBeDefined()

    describe "getStateByPath", ->

      it "should allow retreival by dot-notated path", ->
        expect(@chart.getStateByPath(@chart, 'root.post')).toEqual(@chart.states.root.states.post)

    describe "getStatesInPath", ->

      it "should return an array of every state within a dot-notated path", ->
        result = [
          @chart.states.root,
          @chart.states.root.states.post,
          @chart.states.root.states.post.states.show
        ]
        expect(@chart.getStatesInPath(@chart, 'root.post.show')).toEqual(result)

    describe "currentState", ->

      it "should default to null if no starting state has been specified", ->
        expect(Chart.create().currentState).toEqual(null)

      #it "should be set on chart creation to any state named start", ->
      #  chart = Chart.create
      #    start: State.create()
      #  expect(chart.currentState).toEqual(chart.states.start)

    describe "getTransitions", ->

      beforeEach ->
        currentState = @chart.getStateByPath(@chart, 'root.post.show')
        @transition = @chart.getTransitions(currentState, 'comments.show')

      it "should find shared parent node for a transition", ->
        expect(@transition.sharedParent).toEqual(@chart.states.root)

      it "should find the states needed to exit during a transition", ->
        expect(@transition.exitStates[0]).toEqual(@chart.states.root.states.post)
        expect(@transition.exitStates[1]).toEqual(@chart.states.root.states.post.states.show)

      it "should find the states needed to enter during a transition", ->
        expect(@transition.enterStates[0]).toEqual(@chart.states.root.states.comments)
        expect(@transition.enterStates[1]).toEqual(@chart.states.root.states.comments.states.show)

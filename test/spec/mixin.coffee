define [

  "charter/mixin"

],

(Mixin) ->

  describe "Mixins", ->

    describe "Traversal", ->

      beforeEach ->
        receiver = ->
        Mixin.Traversal(receiver)

        @test = new receiver()
        @test.namespace =
          leaf1:
            ['hi','there']
          leaf2:
            computed: Mixin.computed ->
              "dude"


      it "should return the entire context when no lookup is defined", ->
        expect(@test.get()).toEqual(@test)
        expect(@test.get('')).toEqual(@test)
        expect(@test.get([])).toEqual(@test)

      it "should use dot notation to traverse through context", ->
        expect(@test.get('namespace')).toEqual(@test.namespace)

      it "should use arrays to traverse through context", ->
        expect(@test.get(['namespace','leaf1'])).toEqual(@test.namespace.leaf1)

      it "should return undefined when get path does not exist", ->
        expect(@test.get('namespace.name')).toBeUndefined()

      it "should traverse through computed functions", ->
        expect(@test.get('namespace.leaf2.computed')).toEqual("dude")

      it "should allow setting data in the context", ->
        @test.set('database',"test")
        expect(@test.database).toEqual("test")
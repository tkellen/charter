define (require) ->

  Route = require('charter/route')

  describe 'Route', ->

    describe 'create', ->

      it 'should return a route object', ->
        route = Route.create({name:'test'})
        expect(route.type).toEqual('charter/route')
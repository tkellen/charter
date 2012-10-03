define (require) ->

  Router = require('charter/router')
  Route = require('charter/route')

  describe 'Router', ->

    describe 'create', ->

      it 'should return a route object', ->
        router = Router.create({root:Route.create()})
        expect(router.type).toEqual('charter/router')
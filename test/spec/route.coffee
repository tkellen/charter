define (require) ->

  Route = require('charter/route')
  Router = require('charter/router')

  describe 'Route', ->

    beforeEach ->
      namespace =
        Component:
          toString: -> "Component"
          find: { id: 1 };

      location =
        formatURL: (url) -> '#!#' + url;
        setURL: (url) -> @url = url;

      @router = Charter.Router.create
        location: location
        namespace: namespace
        root: Route.create
          index: Route.create
            route: '/',

            showDashboard: (router) ->
              router.transitionTo('dashboard')
              eventTransitions:
                showDashboard: 'dashboard'

            dashboard: Route.create
              route: '/dashboard'

      @router.route('/')

    describe 'create', ->

      it 'should return a route object', ->
        route = Route.create({name:'test'})
        expect(route.type).toEqual('charter/route')

#    describe
#
#
#    describe 'urlForEvent'. ->
#
#
#
#      it 'should look in the current state\'s eventTransitions hash', ->
#         expect(@router.get('currentState.path').toEqual('root.index')
#
#    equal(router.get('currentState.path'), "root.index", "precond - the router is in root.index");
#
#  var url = router.urlForEvent('showDashboard');
#equal(url, "#!#/dashboard");
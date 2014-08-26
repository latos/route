
var people = [
  {id:'123', name:'John'},
  {id:'456', name:'Jane'}
  ];

var peopleMap = {}
peopleMap[people[0].id] = people[0];
peopleMap[people[1].id] = people[1];

angular.module('hx.demoapp', ['hx.ui'])
.controller('MainCtrl', function ($scope, $injector) {
  di = heroin.Injector.wrapAngular($injector);
  di.register('route', createNgRouter);
  var make = di.get('make');

  var app = make(AppCtrl);
  $scope.app = app.ui;
});

function PersonCtrl(createUi, route, person) {
  this.ui = createUi('person.html', {
    person: person
  });
}


function HelpCtrl(createUi) {
  this.ui = createUi('help.html');
}
function PeopleCtrl(createUi, route, di) {
  console.log('PeopleCtrl ctor');
  route([
    ['.+', function(setCurrent, itemId) {
      var routeChild = route.child(itemId);
      setCurrent(di.child({
        'itemId' : itemId,
        'person' : function (itemId) {
          console.log('itemId', itemId);
          return peopleMap[itemId];
        }
      })
      .value('route', routeChild)
      .make(PersonCtrl));

      return routeChild;
    }]
  ]);

  this.ui = createUi('people.html', {
    people: people,
    route: route
  });
}

var ItemModule = {
  'foo': 5,
  'bar': function(foo) { 
    return foo + 10;
  }
};

function AppCtrl(createUi, route, di) {

  this.ui = createUi('app.html', {
    x: 'y',
    go: route.go,
    route: route
  });


  var helpCtrl = di.make(HelpCtrl);


  var peopleRoute1 = route.child('people');
  var people1Ctrl = di.make(PeopleCtrl, {route: peopleRoute1});

  var foozRoute = route.child('fooz', {
    // todo

  });

  /*
  var r = new RouteHelper(route, di);

  route(
    ['people', function() {}],
    ['.*', function() {}],


     r.fixed('people', PeopleCtrl, Module, function(r) {
     }),

     r.dynamic('.*', PeopleCtrl, Module, function(r) {
       r.route(
          r.dick
        ...
        ...

       );

     });

*/



  route([
    ['people', function(setCurrent) {
      setCurrent(people1Ctrl);
      return peopleRoute1;
    }],

    ['people2', function(setCurrent, x) {
      var routeChild = route.child(x);
      setCurrent(
        di.child(ItemModule)
        .value('route', routeChild)
        .make(PeopleCtrl));
      return routeChild;
    }],

    ['help', function(setCurrent) {
      setCurrent(helpCtrl);
      return null;
    }]
  ]);

}

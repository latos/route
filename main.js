
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
function PeopleCtrl(createUi, route) {
  route({
    '.+': function(di, itemId) {
      di.load({
        'itemId' : itemId,
        'person' : function (itemId) {
          console.log('itemId', itemId);
          return peopleMap[itemId];
        }
      });

      return di.make(PersonCtrl);
    }
  });

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

function AppCtrl(createUi, route) {

  this.ui = createUi('app.html', {
    x: 'y',
    go: route.go,
    route: route
  });




  route({
    'people': function(di) {
      di.load(ItemModule);

      return di.make(PeopleCtrl);
    },

    'help': function(di) {


      return di.make(HelpCtrl);
    }
  });

}

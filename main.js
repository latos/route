
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
  route({
    '.+': function(linkChild, itemId) {
      return di.child({
        'itemId' : itemId,
        'person' : function (itemId) {
          console.log('itemId', itemId);
          return peopleMap[itemId];
        }
      })
      .value('route', linkChild())
      .make(PersonCtrl);
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

function AppCtrl(createUi, route, di) {

  this.ui = createUi('app.html', {
    x: 'y',
    go: route.go,
    route: route
  });


  var helpCtrl = di.make(HelpCtrl);


  var peopleRoute1 = route.child('people');
  var people1 = di.make(PeopleCtrl, {route: peopleRoute1});



  route({
    'people': function(linkChild) {
      linkChild(peopleRoute1);
      return people1;
    },

    'people2': function(linkChild) {
      return di.child(ItemModule)
      .value('route', linkChild())
      .make(PeopleCtrl);
    },

    'help': function(linkChild) {
      return helpCtrl;
    }
  });

}

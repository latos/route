function createNgRouter(di, $location, $rootScope) {
  var listener;
  var adapter = {
    addListener: function(l) {
      listener = l;
    },
    set: function(path) {
      $location.path(path);
    }
  };
  $rootScope.$watch(function() { return $location.path(); }, function(path) {
    listener && listener(path);
  });
  return createRouter(di, null, adapter);
}

function createRouter(di, parent, location){
  var map = null;
  function route(routeMap) {
    if (map) {
      throw new Error('already initialised');
    }

    map = routeMap;


    //route.updateSegments();

    if (route._initSegments) {
      route.updateSegments(route._initSegments);
      route._initSegments = null;
    }
  }

  /**
   * Current controller
   */
  route.current = null;

  var currentSegment = '';

  var currentChild = null;

  route.parent = parent;
  route.root = parent ? parent.root : route;

  route.go = function(path) {
    console.log('Update', route.prefix(), path, route.root == route);
    // Initial slash means start from root
    var r = route;
    if (path.charAt(0) == '/') {
      r = r.root;
      path = path.substring(1);
    }

    // Strip final slash
    if (path.charAt(path.length - 1) == '/') {
      path = path.substr(0, path.length - 1);
    }

    // Go up through parents for each '..' component
    var segments = path.split(/\//);
    while (segments[0] == '..') {
      segments.shift();
      r = r.parent;
      if (!r) {
        throw new Error('Trying to go higher than root with ' + path);
      }
    }

    // Pump all changes through the location, and listen to it.
    location.set(r.prefix() + (path ? '/' + path : ''));
  };

  route.updateSegments = function(segments) {
    var seg = segments[0] || '';

    if (seg === currentSegment) {
      console.log("UNCHANGED", seg);
      if (currentChild) {
        console.log("and updating child", segments);
          currentChild.updateSegments(segments.slice(1));
      }
    } else {
      console.log("CHANGED", seg, currentSegment);

      currentSegment = seg;
      currentChild = null;
      route.current = null;

      for (var k in map) {
        console.log('matching', seg, ' against', k);
        var matches = seg.match('^' + k + '$');
        if (matches) {
          console.log("Yay got match", matches);
          var childInjector = di.child({
            'route': function(di) { // inject child injector
              currentChild = createRouter(di, route, location);
              currentChild._initSegments = segments.slice(1);
              return currentChild;
            }
          });

          
          var args = [childInjector].concat(matches);

          route.current = map[k].apply(null, args);

          break;
        }
      }

    }
  };

  route.path = function() {
    return currentSegment + (currentChild ? '/' + currentChild.path() : '');
  };
  route.fullPath = function() {
    return '/' + route.root.path();
  };
  route.dirname = function() {
    return route.prefix() || '/';
  };
  route.prefix = function() {
    if (route.parent) {
      return route.parent.prefix() + '/' + route.parent.currentSegment();
    } else {
      return '';
    }
  };
  route.currentSegment = function() {
    return currentSegment;
  };

  if (!parent) {
    location.addListener(function(path) {
      if (!path.charAt(0) == '/') {
        location.set('/' + path);
      } else if (path.charAt(path.length - 1) == '/') {
        console.log("SWITCHING");
        location.set(path.substr(0, path.length - 1));
      } else {
        console.log("Proceeding with", path);
        route.updateSegments(path.split(/\//).slice(1));
      }
    });
  }

  console.log('Created router on', route.prefix());

  return route;
}


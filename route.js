function createNgRouter($location, $rootScope) {
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
  return createRouter(null, adapter);
}


function createRouter(parent, location){
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

    return route; // for convenience
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

  var currentChildLinker = null;

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

          var childSegments = segments.slice(1);

          function linkChild(reusedChildRouter) {
            if (linkChild != currentChildLinker) {
              console.warn('ignoring call to linkChild(), as a new one has superseded it');
              return;
            }

            if (!reusedChildRouter) {
              currentChild = route.child(seg);
              currentChild._initSegments = childSegments;
            } else {
              currentChild = reusedChildRouter;
              currentChild.updateSegments(childSegments);
            }
            return currentChild;
          }
          currentChildLinker = linkChild;

          
          var args = [linkChild].concat(matches);

          route.current = map[k].apply(null, args);

          break;
        }
      }

    }
  };

  route.child = function(segment) {
    // TODO: use segment argument.
    // change it so the child stores the segment to reach it,
    // not the current segment.  it can still store the current child router,
    // which implies the current child segment.  that means a router's prefix path
    // is immutable, which is a nice property to have and lets us do cool things.

    if (segment.indexOf('/') >= 0) {
      throw new Error('Path segment cannot contain /');
    }

    return createRouter(route, location);
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


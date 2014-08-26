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
  return createRouter(null, null, adapter);
}


function createRouter(basename, parent, location){
  basename = basename || '';
  parent = parent || null;
  if ( (basename === '') != (parent === null) ) {
    throw new Error(
      'Only root may have an empty basename, and root must have an empty basename');
  }

  var mappings = null;
  function route(routeMap) {
    if (mappings) {
      throw new Error('already initialised');
    }

    mappings = routeMap;


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

  route.basename = function() {
    return basename;
  };

  var currentSetter = null;

  route.updateSegments = function(segments) {
    var childSegments = segments.slice(1);

    // Fiddly code that is effecitvely:
    //    mappingsInitialized.then -> do the rest of this function.
    if (!mappings) {
      route._initsegments = childSegments;
      return;
    }

    var seg = segments[0] || '';

    if (currentChild && seg === currentChild.basename()) {
      console.log("UNCHANGED", seg);
      if (currentChild) {
        console.log("and updating child", segments);
        currentChild.updateSegments(childSegments);
      }
    } else {
      currentChild = null;
      route.current = null;

      var len = mappings.length;
      for (var i = 0; i < len; i++) {
        var k = mappings[i][0];
        var func = mappings[i][1];

        console.log('matching', seg, ' against', k);
        var matches = seg.match('^' + k + '$');
        if (matches) {

          function setCurrent(currentObject) {
            if (setCurrent != currentSetter) {
              console.warn('ignoring call to setCurrent(), as a new one has superseded it');
              return;
            }

            route.current = currentObject;
          }
          currentSetter = setCurrent;

          
          var args = [setCurrent].concat(matches);

          var newChild = func.apply(null, args);
          if (newChild !== null) {
            if (newChild === undefined) {
              throw new Error('You forgot to return something from route function. '
                  + 'Return a route child, or null if no further routing is useful.');
            }
            if (!newChild.basename) {
              throw new Error('Did not return a route child from route function');
            }

            if (newChild.basename() != seg) {
              throw new Error('returned route child "' + newChild.basename() 
                + '" did not match expected: "' + seg + '"');

            }

            currentChild = newChild;
          }

          break;
        }
      }

    }
  };

  route.child = function(segment, mappings /*optional*/) {
    // TODO: use segment argument.
    // change it so the child stores the segment to reach it,
    // not the current segment.  it can still store the current child router,
    // which implies the current child segment.  that means a router's prefix path
    // is immutable, which is a nice property to have and lets us do cool things.

    if (segment.indexOf('/') >= 0) {
      throw new Error('Path segment cannot contain /');
    }

    var r = createRouter(segment, route, location);

    if (mappings) {
      r(mappings);
    }

    return r;
  };

  route.path = function() {
    return '/' + route.prefix();
  };
  route.prefix = function() {
    if (route.parent) {
      return route.parent.prefix() + '/' + basename;
    } else {
      return '';
    }
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


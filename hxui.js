(function() {

var module = angular.module('hx.ui', [])

/**
 * A Better method for creating re-usable 'widgets'.
 *
 * If you want to provide custom initialisation logic, provide a $init method.
 * This is called every time the widget is rendered, and is the place to
 * set up any hooks/scope watches etc. The $init method gets given the
 * current angular scope.
 *
 * @param template (eg. report, richTextEditor, etc.)
 * @param object The view model object, accessible as 'ui' in the template.
 */
module.factory('createUi', function() {
  function createUi(template, model) {
    model = model || {};
    model.$templateUrl = template;

    if (!model.hasOwnProperty('$init')) {
      model.$init = angular.noop;
    }

    var bound = [];


    model.$bind = function(object) {
      bound.push(object);
    };

    model.$bind.get = function() {
      return bound;
    };

    return model;
  };


  return createUi;
})

/**
 * Usage:
 *   <hx-ui ui='object_created_with_create_ui' [src='/path/to/different/template.html']></hx-ui>
 */
.directive('ui', function() {
  return {
    template: '<ng-include src="ui.$templateUrl"></ng-include>',
    restrict: 'ECA',
    scope: {
      ui: '='
    },
    link: function(scope, attrs) {
      scope.$watch('ui', function(ui) {
        if (ui) {
          var bound = scope.ui.$bind.get(), len = bound.length;
          for (var i = 0; i < len; i++) {
            bound[i].$init(scope);
          }

          scope.ui.$init(scope);
        }
      });
    }
  };
})


})();


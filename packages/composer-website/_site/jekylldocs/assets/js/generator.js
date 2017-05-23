/*global jQuery, _, List */
(function (win, $) {
  'use strict';

  // Settings for doT.js
  var doT = win.doT;
  doT.templateSettings.interpolate = /<\%=([\s\S]+?)\%\>/g;
  doT.templateSettings.conditional = /<\%if( else)?\s*([\s\S]*?)\s*\%>/g;
  doT.templateSettings.iterate = /<\%each\s*(?:\%>|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\%>)/g;

  $(function() {
    var instructions = $('#instructions');
    $('#instructions-toggle').on('click', function (e) {
      e.preventDefault();
      instructions.toggle('fast');
    });

    var tpl = doT.template($('#plugins-all-template').text());
    var pluginsAll = $('#plugins-all');

    $.getJSON('https://storage.googleapis.com/generators.yeoman.io/cache.json')
    .done(function (plugins) {
      pluginsAll.html(tpl({
        modules: plugins.sort(function (a, b) {
          return a.stars === b.stars ? 0 : a.stars < b.stars ? 1 : -1;
        })
    }));
      var list = new List('plugins-all', {
        valueNames: [
          'name',
          'owner',
          'stars',
          'updated',
          'downloads',
          'description'
        ]
      });

      if (list.listContainer) {
        list.on('updated', function () {
          $('.table thead').toggle(list.matchingItems.length !== 0);
          $('#search-notfound').toggle(list.matchingItems.length === 0);
        });
      }
    });
  });
})(window, jQuery);

/**
 * Created by Marc Streit on 06.08.2014.
 */
define(['exports', 'd3', '../caleydo_tooltip/main', '../caleydo_core/main', '../caleydo_core/d3util', 'css!./style'], function (exports, d3, tooltip, C, d3utils) {

  function createText(stats) {
    var r = '<table><tbody>';
    var keys = ['min', 'max', 'sum', 'mean', 'var', 'sd', 'n', 'nans', 'moment2', 'moment3', 'moment4', 'kurtosis', 'skewness'];
    keys.forEach(function (key) {
      var value = stats[key];
      r = r + '<tr><td>' + key + '</td><td>' + value + '</td></tr>';
    });
    r = r + '</tbody></table>';
    return r;
  }

  exports.BoxPlot = d3utils.defineVis('BoxPlot', {}, [300, 50], function ($parent, data, size) {
    var $svg = $parent.append("svg").attr({
      width: size[0],
      height: size[1],
      'class': 'box'
    });

    var $t = $svg.append('g');

    var s = this.scale = d3.scale.linear().domain(this.data.desc.value.range).range([0, size[0]]).clamp(true);

    $t.append('path').attr({
      d: 'M0,0 L0,$ M0,§ L%,§ M%,0 L%,$'.replace(/%/g, size[0]).replace(/\$/g, size[1]).replace(/\§/g, size[1] / 2),
      'class': 'axis'
    });
    var that = this;
    data.stats().then(function (stats) {
      var text = createText(stats);

      $t.append('rect').attr({
        x: s(stats.mean - stats.sd),
        y: '10%',
        width: s(stats.sd * 2),
        height: '80%',
        'class': 'box'
      }).call(tooltip.bind(text));

      $t.append('line').attr({
        x1: s(stats.mean),
        x2: s(stats.mean),
        y1: '10%',
        y2: '90%',
        'class': 'mean'
      });
      that.markReady();
    });

    return $svg;
  }, {
    locateIt : function (range) {
      var that = this;
      if (range.isAll || range.isNone) {
        var r = this.scale.range();
        return { x: r[0], w: r[1] - r[0], y: 0, h : 50 };
      }
      return this.data.data(range).then(function (data) {
        var ex = d3.extent(data, that.scale);
        return { x: ex[0], w: ex[1] - ex[0], y: 0, h : 50 };
      });
    }
  });

  function create(data, parent) {
    return new exports.BoxPlot(data, parent);
  }

  exports.create = create;
});

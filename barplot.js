/**
 * Created by Samuel Gratzl on 24.11.2014.
 */
/* global define */
"use strict"

define(['exports', 'd3', '../caleydo_core/main', '../caleydo_core/idtype', '../caleydo_core/geom', '../caleydo_core/d3util', 'css!./style'], function (exports, d3, C, idtypes, geom, d3utils) {
  exports.BarPlot = d3utils.defineVis('BarPLot', {
    cssClass: '',
    width: 100,
    heighti: 10,
    min: 0,
    max: NaN
  }, function (data) {
    return [this.options.width, data.dim[0] * this.options.heighti];
  }, function ($parent, data, size) {
    var o = this.options, that = this;
    var $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'barplot ' + o.cssClass
    });

    //using range bands with an ordinal scale for uniform distribution
    var xscale = that.xscale = d3.scale.linear().range([0, 100]);
    var yscale = that.yscale = d3.scale.linear().range([0, 100]);

    var onClick = function (d, i) {
      data.select(0, [i], idtypes.toSelectOperation(d3.event));
    };

    var l = function (event, type, selected) {
      $svg.selectAll('rect').classed('select-' + type, false);
      if (selected.isNone) {
        return;
      }
      var dim0 = selected.dim(0);
      if (selected.isAll) {
        $svg.selectAll('rect').classed('select-' + type, true);
      } else {
        dim0.forEach(function (j) {
          $svg.selectAll('rect:nth-child(' + (j + 1) + ')').classed('select-' + type, true);
        });
      }
    };
    data.on('select', l);
    C.onDOMNodeRemoved($svg.node(), function () {
      data.off('select', l);
    });

    data.data().then(function (_data) {
      yscale.domain([0, data.length]);
      if (isNaN(o.min) || isNaN(o.max)) {
        var minmax = d3.extent(_data);
        if (isNaN(o.min)) {
          o.min = minmax[0];
        }
        if (isNaN(o.max)) {
          o.max = minmax[1];
        }
      }
      xscale.domain([o.min, o.max]);

      var $m = $svg.selectAll('rect').data(_data);
      $m.enter().append('rect')
        .on('click', onClick);
      $m.attr({
        y: function (d, i) {
          return yscale(i);
        },
        height: function (d) {
          return yscale(1);
        },
        width: function (d) {
          return xscale(d);
        }
      });
      that.markReady();
      data.selections().then(function (selected) {
        l(null, 'selected', selected);
      });
    });

    return $svg;
  }, {
    locateIt: function (range) {
      var o = this.options, that = this;
      var ex_i = d3.extent(range.dim(0).iter().asList());

      return this.data.data(range).then(function (data) {
        var ex_v = d3.extent(data);
        return geom.rect(
          that.xscale(ex_v[0]) / 100.0 * o.width,
          ex_i[0] * o.heighti,
          that.xscale(ex_v[1]) / 100.0 * o.width,
          (ex_i[1] + 1) * o.heighti
        );
      });
    }
  });

  exports.create = function createBarPlot(data, parent, options) {
    return new exports.BarPlot(data, parent, options);
  };
})
;

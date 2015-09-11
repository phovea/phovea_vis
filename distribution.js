/**
 * Created by Samuel Gratzl on 13.10.2014.
 */
/* global define */
"use strict";

define(['exports', 'd3', '../caleydo_core/main', '../caleydo_core/idtype', '../caleydo_tooltip/main', '../caleydo_d3/d3util'], function (exports, d3, C, idtypes, tooltip, d3utils) {

  function createCategoricalHistData(hist) {
    const categories = hist.categories,
        cols = hist.colors || d3.scale.category10().range(),
        total = hist.count;
    var data = [],
      acc = 0;
    hist.forEach(function (b, i) {
      data[i] = {
        v: b,
        acc : acc,
        ratio: b / total,
        range: hist.range(i),

        name: (typeof categories[i] === 'string') ? categories[i] : categories[i].name,
        color: (categories[i].color === undefined) ? cols[i] : categories[i].color
      };
      acc += b;
    });
    return data;
  }

  function createNumericalHistData(hist, range) {
    var data = [],
      cols = d3.scale.linear().domain(range).range(['#111111', '#999999']),
      total = hist.count,
      binWidth = (range[1] - range[0]) / hist.bins,
      acc = 0;
    hist.forEach(function (b, i) {
      data[i] = {
        v: b,
        acc : acc,
        ratio: b / total,
        range: hist.range(i),

        name: 'Bin ' + (i + 1) + ' (center: ' + d3.round((i + 0.5) * binWidth, 2) + ')',
        color: cols((i + 0.5) * binWidth)
      };
      acc += b;
    });
    return data;
  }

  function createHistData(hist, desc, data) {
    if (desc.type === 'stratification') {
      return createCategoricalHistData(hist);
    }
    if (data.valuetype.type === 'categorical') {
      return createCategoricalHistData(hist);
    }
    return createNumericalHistData(hist, data.valuetype.range);
  }

  exports.Histogram = d3utils.defineVis('HistogramVis', function (data) {
    return {
      nbins: Math.round(Math.sqrt(data.desc.type === 'matrix' ? data.ncol * data.nrow : data.length)),
      totalHeight: true,
      duration: 200
    };
  }, [200, 100], function ($parent, data, size) {
    var o = this.options, that = this;
    var $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'histogram'
    });
    var $t = $svg.append('g');
    var $data = $t.append('g');
    var $highlight = $t.append('g').style('pointer-events', 'none').classed('select-selected', true);

    //using range bands with an ordinal scale for uniform distribution
    var xscale = that.xscale = d3.scale.ordinal().rangeBands([0, size[0]], 0.1);
    var yscale = that.yscale = d3.scale.linear().range([0, size[1]]);

    var l = function (event, type, selected) {
      var highlights = that.hist_data.map(function (entry, i) {
        var s = entry.range.intersect(selected);
        return {
          i: i,
          v: s.size()[0]
        };
      }).filter(function (entry) {
        return entry.v > 0;
      });
      var $m = $highlight.selectAll('rect').data(highlights);
      $m.enter().append('rect').attr('width', xscale.rangeBand());
      $m.attr({
        x: function (d) {
          return xscale(d.i);
        },
        y: function (d) {
          return yscale(yscale.domain()[1] - d.v);
        },
        height: 0
      });
      $m.transition().duration(o.duration).attr('height', function (d) {
          return yscale(d.v);
        });
      $m.exit().remove();
    };
    data.on('select', l);
    C.onDOMNodeRemoved($data.node(), function () {
      data.off('select', l);
    });

    var onClick = function (d) {
      data.select(0, d.range, idtypes.toSelectOperation(d3.event));
    };

    this.data.hist(o.nbins).then(function (hist) {
      that.hist = hist;
      xscale.domain(d3.range(hist.bins));
      yscale.domain([0, o.totalHeight ? hist.count : hist.largestFrequency]);
      var hist_data = that.hist_data = createHistData(hist, that.data.desc, that.data);

      var $m = $data.selectAll('rect').data(hist_data);
      $m.enter().append('rect')
        .attr('width', xscale.rangeBand())
        .call(tooltip.bind(function (d) {
          return d.name + ' ' + (d.v) + ' entries (' + Math.round(d.ratio * 100) + '%)';
        }))
        .on('click', onClick);
      $m.attr({
        x: function (d, i) {
          return xscale(i);
        },
        fill: function (d) {
          return d.color;
        },
        y: function (d) {
          return yscale(yscale.domain()[1] - d.v);
        },
        height: function (d) {
          return yscale(d.v);
        }
      });
      that.markReady();
      data.selections().then(function (selected) {
        l(null, 'selected', selected);
      });
    });

    return $svg;
  }, {
    locateImpl: function (range) {
      var that = this, size = this.rawSize;
      if (range.isAll || range.isNone) {
        return Promise.resolve({x: 0, y: 0, w: size[0], h: size[1]});
      }
      return this.data.data(range).then(function (data) {
        var ex = d3.extent(data, function (value) {
          return that.hist.binOf(value);
        });
        var h0 = that.hist_data[ex[0]];
        var h1 = that.hist_data[ex[1]];
        return Promise.resolve({
          x: that.xscale(ex[0]),
          width: (that.xscale(ex[1]) - that.xscale(ex[0]) + that.xscale.rangeBand()),
          height: that.yscale(Math.max(h0.v, h1.v)),
          y: that.yscale(that.yscale.domain()[1] - Math.max(h0.v, h1.v))
        });
      });
    }
  });

  exports.Mosaic = d3utils.defineVis('MosaicVis', {
    width: 20,
    initialScale: 10,
    duration: 200
  }, function (data) {
    return [this.options.width, data.dim[0]];
  }, function ($parent, data, size) {
    var o = this.options, that = this;
    var $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'mosaic'
    });
    var $scale = $svg.append('g').attr('transform', 'scale(' + o.scale[0] + ',' + o.scale[1] + ')');
    var $data = $scale.append('g');
    var $highlight = $scale.append('g').style('pointer-events', 'none').classed('select-selected', true);

    var l = function (event, type, selected) {
      var highlights = that.hist_data.map(function (entry, i) {
        var s = entry.range.intersect(selected);
        return {
          i: i,
          acc: entry.acc,
          v: s.size()[0]
        };
      }).filter(function (entry) {
        return entry.v > 0;
      });
      var $m = $highlight.selectAll('rect').data(highlights);
      $m.enter().append('rect').attr('width', '100%').classed('select-selected', true);
      $m.attr({
        y: function (d) {
          return d.acc;
        },
        height: function (d) {
          return d.v;
        }
      }).style('opacity',0);
      $m.transition().duration(o.duration).style('opacity',1);
      $m.exit().remove();
    };
    data.on('select', l);
    C.onDOMNodeRemoved($data.node(), function () {
      data.off('select', l);
    });

    var onClick = function (d) {
      data.select(0, d.range, idtypes.toSelectOperation(d3.event));
    };

    this.data.hist(o.nbins).then(function (hist) {
      that.hist = hist;
      var hist_data = that.hist_data = createHistData(hist, data.desc, data);

      var $m = $data.selectAll('rect').data(hist_data);
      $m.enter().append('rect')
        .attr('width', '100%')
        .call(tooltip.bind(function (d) {
          return d.name + ' ' + (d.v) + ' entries (' + Math.round(d.ratio * 100) + '%)';
        }))
        .on('click', onClick);
      $m.attr({
        y: function (d) {
          return d.acc;
        },
        height: function (d) {
          return d.v;
        },
        fill: function (d) {
          return d.color;
        }
      });
      that.fire('built');
      data.selections().then(function (selected) {
        l(null, 'selected', selected);
      });
    });

    return $svg;
  }, {
    init: function () {
      this.options.scale = [1, this.options.initialScale];
    },
    locateIt: function locateIt(range) {
      var that = this;
      if (range.isAll || range.isNone) {
        return Promise.resolve({x: 0, y: 0, w: this.rawSize[0], h: this.data.length});
      }
      return this.data.data(range).then(function (data) {
        var ex = d3.extent(data, function (value) {
          return that.hist.binOf(value);
        });
        var h0 = that.hist_data[ex[0]];
        var h1 = that.hist_data[ex[1]];
        var y = Math.min(h0.acc, h1.acc);
        var y2 = Math.max(h0.acc + h0.v, h1.acc + h1.v);
        return Promise.resolve({
          x: 0,
          width: that.rawSize[0],
          height: y2 - y,
          y: y
        });
      });
    }
  });
  function toPolygon(start, end, radius) {
    var r = [
      {x: radius, y: radius},
      {x: radius + Math.cos(start) * radius, y: radius + Math.sin(start) * radius},
      {x: radius + Math.cos(end) * radius, y: radius + Math.sin(end) * radius}
    ];
    //approximate by triangle
    if (end - start > Math.PI) { //more than 180 degree use one more point
      r.splice(2, 0, {
        x: radius + Math.cos((end - start) * 0.5) * radius,
        y: radius + Math.sin((end - start) * 0.5) * radius
      });
    }
    return geom.polygon(r);
  }

  exports.Pie = d3utils.defineVis('Pie', {
    radius: 50,
    innerRadius: 0,
    duration: 200
  }, function () {
    var r = this.options.radius;
    return [r * 2, r * 2];
  }, function ($parent, data, size) {
    var o = this.options, that = this;
    var $svg = $parent.append("svg").attr({
      width: size[0],
      height: size[1],
      'class': 'pie'
    });
    var $base = $svg.append('g').attr('transform', 'translate(' + o.radius + ',' + o.radius + ')');
    var $data = $base.append('g');
    var $highlight = $base.append('g').style('pointer-events', 'none').classed('select-selected', true);

    var scale = this.scale = d3.scale.linear().range([0, 2 * Math.PI]);
    var arc = this.arc = d3.svg.arc().innerRadius(o.innerRadius).outerRadius(o.radius)
      .startAngle(function (d) {
        return scale(d.start);
      })
      .endAngle(function (d) {
        return scale(d.end);
      });

    var l = function (event, type, selected) {
      var highlights = that.hist_data.map(function (entry) {
        var s = entry.range.intersect(selected);
        return {
          start: entry.start,
          end: entry.start + s.size()[0]
        };
      }).filter(function (entry) {
        return entry.start < entry.end;
      });
      var $m = $highlight.selectAll('path').data(highlights);
      $m.enter().append('path');
      $m.exit().remove();
      $m.attr('d', arc);
    };
    data.on('select', l);
    C.onDOMNodeRemoved($data.node(), function () {
      data.off('select', l);
    });

    data.hist().then(function (hist) {
      that.hist = hist;
      var total = o.total || hist.count;
      scale.domain([0, total]);
      var hist_data = that.hist_data = [], prev = 0, cats = hist.categories;

      var cols = hist.colors || d3.scale.category10().range();
      hist.forEach(function (b, i) {
        hist_data[i] = {
          name: (typeof cats[i] === 'string') ? cats[i] : cats[i].name,
          start: prev,
          size: b,
          ratio: b / total,
          end: prev + b,
          color: (cats[i].color === undefined) ? cols[i] : cats[i].color,
          range: hist.range(i)
        };
        prev += b;
      });
      var $m = $data.selectAll('path').data(hist_data);
      $m.enter()
        .append('path')
        .call(tooltip.bind(function (d) {
          return d.name + ' ' + (d.size) + ' entries (' + Math.round(d.ratio * 100) + '%)';
        }))
        .on('click', function (d) {
          data.select(0, d.range, idtypes.toSelectOperation(d3.event));
        });
      $m.attr('d', arc).attr('fill', function (d) {
        return d.color;
      }).style('opacity',0);
      //fade in animation
      $m.transition().duration(o.duration).delay(function(d,i) { return i * o.duration;}).style('opacity',1);

      that.markReady();
      data.selections().then(function (selected) {
        l(null, 'selected', selected);
      });
    });

    return $svg;
  }, {
    locateIt: function (range) {
      var that = this, o = this.options;
      if (range.isAll || range.isNone) {
        return Promise.resolve({x: o.radius, y: o.radius, radius: o.radius});
      }
      return this.data.data(range).then(function (data) {
        var ex = d3.extent(data, function (value) {
          return that.hist.binOf(value);
        });
        var startAngle = that.scale(that.hist_data[ex[0]].start);
        var endAngle = that.scale(that.hist_data[ex[1]].end);
        return Promise.resolve(toPolygon(startAngle, endAngle, o.radius));
      });
    },
    updatedOption: function (name, value) {
      if (name === 'innerRadius' || name === 'radius' || name === 'total') {
        this.updateVis();
      }
    },
    updateVis : function() {
      var o = this.options;
      this.arc.innerRadius(o.innerRadius).outerRadius(o.radius);
      this.scale.domain([0, o.total || this.hist.count]);

      $svg.selectAll('path').transition().attr('d', this.arc);
    },
    transform: function (scale, rotate) {
      var bak = {
        scale: this.options.scale || [1, 1],
        rotate: this.options.rotate || 0
      };
      if (arguments.length === 0) {
        return bak;
      }
      this.$node.attr({
        width: this.options.radius * 2 * scale[0],
        height: this.options.radius * 2 * scale[1]
      }).style('transform', 'rotate(' + rotate + 'deg)');
      this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')translate(' + this.options.radius + ',' + this.options.radius + ')');

      var new_ = {
        scale: scale,
        rotate: rotate
      };
      this.fire('transform', new_, bak);
      this.options.scale = scale;
      this.options.rotate = rotate;
      return new_;
    }
  });

  exports.create = function createHistogram(data, parent, options) {
    return new exports.Histogram(data, parent, options);
  };
  exports.createMosaic = function createMosaic(data, parent, options) {
    return new exports.Mosaic(data, parent, options);
  };
  exports.createPie = function createPie(data, parent, options) {
    return new exports.Pie(data, parent, options);
  };
});

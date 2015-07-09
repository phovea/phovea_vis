/**
 * Created by Samuel Gratzl on 08.10.2014.
 */
define(['exports', 'd3', '../caleydo_web/main', '../caleydo_web/d3util', 'css!./style'], function (exports, d3, C, utils) {
  exports.Axis = utils.defineVis('Axis', {
    shift: 10,
    tickSize: 2,
    orient: 'left',
    r: 2
  }, [50, 300], function ($parent, data, size) {
    var o = this.options, that = this;
    var $svg = $parent.append("svg").attr({
      width: size[0],
      height: size[1],
      'class': 'axis'
    });
    $svg.data(this);
    var $root = $svg.append('g');
    var $axis = this.$axis = $root.append('g').attr('class', 'makeover');
    var $points = this.$points = $root.append('g');
    var s = this.scale = d3.scale.linear().domain(data.desc.value.range).range([o.shift, ((o.orient === 'left' || o.orient === 'right') ? size[1] : size[0]) - o.shift]).clamp(true);
    var axis = this.axis = d3.svg.axis()
      .tickSize(o.tickSize)
      .orient(o.orient)
      .scale(s);

    switch (o.orient) {
    case 'left':
      $points.attr('transform', 'translate(' + (size[0] - o.shift) + ',0)');
      $axis.attr('transform', 'translate(' + (size[0] - o.shift) + ',0)');
      break;
    case 'right':
      $points.attr('transform', 'translate(' + o.shift + ',0)');
      $axis.attr('transform', 'translate(' + o.shift + ',0)');
      break;
    case 'top':
      $points.attr('transform', 'translate(0, ' + o.shift + ')');
      $axis.attr('transform', 'translate(0,' + o.shift + ')');
      break;
    case 'bottom':
      $points.attr('transform', 'translate(0, ' + (size[1] - o.shift) + ')');
      $axis.attr('transform', 'translate(0,' + (size[1] - o.shift) + ')');
      break;
    }
    $axis.call(axis);

    var onClick = utils.selectionUtil(this.data, $points, 'circle');

    var cxy = (o.orient === 'left' || o.orient === 'right') ? 'cy' : 'cx';
    data.data().then(function (arr) {
      var $p = $points.selectAll('circle').data(arr);
      $p.enter().append('circle').attr('r', o.r).on('click', onClick);
      $p.exit().remove();
      $p.attr(cxy, s);
      that.markReady();
    });
    return $svg;
  }, {
    locateImpl : function (range) {
      var that = this;
      if (range.isAll || range.isNone) {
        var r = this.scale.range();
        return C.resolved(that.wrap({ y: r[0], h: r[1] - r[0] }));
      }
      return this.data.data(range).then(function (data) {
        var ex = d3.extent(data, that.scale);
        return that.wrap({ y: ex[0], h: ex[1] - ex[0] });
      });
    },
    transform : function (scale, rotate) {
      var bak = {
        scale: this.options.scale || [1, 1],
        rotate: this.options.rotate || 0
      };
      if (arguments.length === 0) {
        return bak;
      }
      var o = this.options;
      var size = this.rawSize;
      this.$node.attr({
        width: size[0] * scale[0],
        height: size[1] * scale[1]
      }).style('transform', 'rotate(' + rotate + 'deg)');

      this.scale.range([o.shift, ((o.orient === 'left' || o.orient === 'right') ? size[1] * scale[1] : size[0] * scale[0]) - o.shift]);
      var cxy = (o.orient === 'left' || o.orient === 'right') ? 'cy' : 'cx';
      this.$points.selectAll('circle').attr(cxy, this.scale);
      this.$axis.call(this.axis);

      var new_ = {
        scale: scale,
        rotate: rotate
      };
      this.fire('transform', new_, bak);
      this.options.scale = scale;
      this.options.rotate = rotate;
      return new_;
    },
    wrap : function (base) {
      var s = this.rawSize;
      switch (this.options.orient) {
      case 'left':
        base.x = s[0] - this.options.shift;
        base.w = 0;
        break;
      case 'right':
        base.x = this.options.shift;
        base.w = 0;
        break;
      case 'top':
        base.x = base.y;
        base.w = base.h;
        base.y = this.options.shift;
        base.h = 0;
        break;
      case 'bottom':
        base.x = base.y;
        base.w = base.h;
        base.y = s[1] - this.options.shift;
        base.h = 0;
        break;
      }
      base.x -= this.options.r;
      base.y -= this.options.r;
      base.w += 2 * this.options.r;
      base.h += 2 * this.options.r;
      return base;
    }
  });


  function create(data, parent, options) {
    return new exports.Axis(data, parent, options);
  }

  exports.create = create;
});

/**
 * Created by Samuel Gratzl on 05.08.2014.
 */


import './style.scss';
import * as d3 from 'd3';
import {AVisInstance, IVisInstance, assignVis} from 'phovea_core/src/vis';
import {mixin} from 'phovea_core/src';
import {GraphProxy} from 'phovea_core/src/graph';

export class ForceDirectedGraphVis extends AVisInstance implements IVisInstance {
  private $node:d3.Selection<any>;

  private options = {
    scale: [1, 1],
    rotate: 0,
    colors: true
  };

  constructor(public data:GraphProxy, public parent:Element, options: any) {
    super();
    mixin(this.options, options);
    this.$node = this.build(d3.select(parent));
    this.$node.datum(data);
    assignVis(<Element>this.$node.node(), this);
  }

  /**
   * the raw size without any scaling factors applied
   * @returns {any[]}
   */
  get rawSize(): [number, number] {
    return [300,300];
  }

  /**
   * access to the HTML Element of this visualization
   * @returns {Element}
   */
  get node() {
    return <Element>this.$node.node();
  }

  /**
   * get/set an option of this vis
   * @param name
   * @param val
   * @returns {any}
   */
  option(name: string, val? : any) {
    if (arguments.length === 1) {
      return this.options[name];
    } else {
      this.fire('option', name, val, this.options[name]);
      this.fire('option.'+name, val, this.options[name]);
      this.options[name] = val;
      //handle option change
    }
  }

  /**
   * transform this visualization given the scaling and rotation factor
   * @param scale a two number array
   * @param rotate a factor in degree
   * @returns {any}
   */
  transform(scale?: number[], rotate: number = 0) {
    var bak = {
      scale: this.options.scale || [1,1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    var raw = this.rawSize;
    this.$node.style('transform','rotate('+rotate+'deg)');
    this.$node.attr('width', raw[0] * scale[0]).attr('height',raw[1] * scale[1]);
    this.$node.select('g').attr('transform','scale('+scale[0]+','+scale[1]+')');
    var new_ = {
      scale: scale,
      rotate: rotate
    };
    this.fire('transform',new_, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return new_;
  }

  private build($parent:d3.Selection<any>) {
    //create a svg and append a group for the transform
    var scaleFactor = this.options.scale, size = this.size;

    //create the svg
    var $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'phovea-graph-force'
    });
    var $root = $svg.append('g').attr('transform','scale('+scaleFactor[0]+','+scaleFactor[1]+')');

    var colors = d3.scale.category20().range();

    this.data.impl().then((graph) => {
      const nodes = graph.nodes.map((n) => ({ v : n }));
      const lookup = d3.map(nodes, (d) => String(d.v.id));
      const edges = graph.edges.map((n) => ({ v : n, source: lookup.get(String(n.source.id)), target: lookup.get(String(n.target.id)) }));
      const f = d3.layout.force()
        .size(this.rawSize);
      f.nodes(nodes).links(edges);

      const $links = $root.selectAll('.edge').data(edges);
      $links.enter().append('line').classed('edge',true);
      $links.attr('data-type',(d) => d.v.type);

      $links.exit().remove();
      const $nodes = $root.selectAll('.node').data(nodes);
      $nodes.enter().append('circle')
        .classed('node',true).attr('r',5)
        .call(f.drag)
        .on('click', (d) => {
          console.log(d.v);
        })
        .append('title');
      $nodes.attr('data-type',(d) => d.v.type);

      if (this.options.colors) {
        $links.style('stroke', (d) => {
          var c = lookup[d.v.type];
          if (!c) {
            c = colors.shift();
            lookup[d.v.type] = c;
          }
          return c;
        });
        $nodes.style('fill', (d) => {
          var c = lookup[d.v.type];
          if (!c) {
            c = colors.shift();
            lookup[d.v.type] = c;
          }
          return c;
        });
      }

      $nodes.select('title').text((d) => d.v.id+' '+d.v.type);
      f.on('tick', () => {
        $links.attr({
          x1: (d) => (<any>d.source).x,
          y1: (d) => (<any>d.source).y,
          x2: (d) => (<any>d.target).x,
          y2: (d) => (<any>d.target).y
        });

        $nodes.attr({
          cx: (d) => (<any>d).x,
          cy: (d) => (<any>d).y
        });
      });

      this.markReady();
      f.start();
    });
    return $svg;
  }
}

export function create(data:GraphProxy, parent:Element, options) {
  return new ForceDirectedGraphVis(data, parent, options);
}

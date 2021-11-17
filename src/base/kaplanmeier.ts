/**
 * Created by Samuel Gratzl on 01.10.2015.
 */

import * as d3 from 'd3';
import {Range} from 'tdp_core';
import {AVisInstance, IVisInstance, VisUtils, IVisInstanceOptions} from 'tdp_core';
import {BaseUtils} from 'tdp_core';
import {INumericalVector} from 'tdp_core';
import {} from 'tdp_core';
import {} from 'tdp_core';
import {} from 'tdp_core';

export interface IKaplanMaierOptions extends IVisInstanceOptions {
  /**
   * @default 300
   */
  width?: number;
  /**
   * @default 300
   */
  height?: number;
  /**
   * maxtime in total given
   * @param died the current one
   * @default last one
   */
  maxTime?(died: number[]): number|Promise<number>;
}

export class KaplanMeierPlot extends AVisInstance implements IVisInstance {
  private readonly $node: d3.Selection<any>;

  private readonly options: IKaplanMaierOptions = {
    scale: [1, 1],
    rotate: 0,
    width: 300,
    height: 300,
    maxTime: (died: number[]) => died[died.length - 1]
  };

  private readonly line = d3.svg.line().interpolate('step');

  constructor(public readonly data: INumericalVector, public parent: Element, options: IKaplanMaierOptions = {}) {
    super();
    //var value = (<any>this.data.desc).value;
    BaseUtils.mixin(this.options, options);
    this.$node = this.build(d3.select(parent));
    this.$node.datum(data);
    VisUtils.assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    return [this.options.width, this.options.height];
  }

  get node() {
    return <Element>this.$node.node();
  }

  locateImpl(range: Range) {
    //TODO
    return Promise.resolve(null);
  }

  transform(scale?: [number, number], rotate: number = 0) {
    const bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    const width = this.options.width, height = this.options.height;
    this.$node.attr({
      width: width * scale[0],
      height: height * scale[1]
    }).style('transform', 'rotate(' + rotate + 'deg)');
    this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')');
    const act = {scale, rotate};
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return act;
  }

  private build($parent: d3.Selection<any>) {
    const width = this.options.width,
      height = this.options.height,
      scale = this.options.scale || [1, 1];

    const $svg = $parent.append('svg').attr({
      width: width * scale[0],
      height: height * scale[1],
      'class': 'phovea-kaplanmeier'
    });

    const $g = $svg.append('g');

    const xscale = d3.scale.linear().range([0, width]);
    const yscale = d3.scale.linear().range([0, height]);

    this.line
      .x((d) => xscale(d[0]))
      .y((d) => yscale(d[1]));

    this.data.data().then((arr) => {
      //TODO
      const died = arr.filter((a) => !isNaN(a) && a !== null).map((a) => Math.abs(a));
      died.sort(d3.ascending);
      //const alive = arr.length - died.length;

      yscale.domain([0, arr.length]);

      Promise.resolve(this.options.maxTime(died)).then((maxAxisTime) => {
        xscale.domain([0, maxAxisTime]);

        //0 ... 100%
        const points = [[0, 0]];
        let prevI = 0;
        for (let i = 1; i < died.length; ++i) {
          while (died[i] === died[i - 1] && i < died.length) {
            ++i;
          }
          points.push([died[prevI], prevI + 1]);
          prevI = i;
        }
        if (died.length > 0) {
          points.push([died[prevI], prevI + 1]);
        }
        points.push([maxAxisTime, died.length]);
        $g.append('path').datum(points).attr('d', this.line);
        this.markReady();
      });
    });
    return $svg;
  }

  static createKaplanMeierPlot(data: INumericalVector, parent: Element, options?: IKaplanMaierOptions) {
    return new KaplanMeierPlot(data, parent, options);
  }
}

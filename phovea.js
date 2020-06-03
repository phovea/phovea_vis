/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function(registry) {
  //registry.push('extension-type', 'extension-id', function() { return import('./dist/extension_impl'); }, {});
  registry.push('vis', 'axis', function () {
    return import('./dist/base/axis').then((a) => a.Axis);
  }, {
    factory: 'createAxis',
    name: 'Axis',
    icon: function() { return import('./dist/assets/axis_icon.svg'); },
    scaling: 'height-only',
    filter: [
      'vector',
      '(real|int)'
    ],
    options: {
      tickSize: {
        type: 'int',
        range: [
          1,
          null
        ],
        default: 2
      },
      orient: {
        type: 'categorical',
        categories: [
          'left',
          'right',
          'top',
          'bottom'
        ],
        default: 'left'
      }
    }
  });
  registry.push('vis', 'barplot', function () {
    return import('./dist/list/barplot').then((b) => b.BarPlot);
  }, {
    factory: 'createBarPlot',
    name: 'Bar Plot',
    icon: function() { return import('./dist/assets/barplot_icon.png'); },
    sizeDependsOnDataDimension: [
      false,
      true
    ],
    filter: [
      'vector',
      '(real|int)'
    ]

  });
  registry.push('vis', 'table', function () {
    return import('./dist/base/table').then((t) => t.Table);
  }, {
    factory: 'createTable',
    name: 'Table',
    filter: '(matrix|table|vector)',
    sizeDependsOnDataDimension: true

  });
  registry.push('vis', 'list', function () {
    return import('./dist/list/list').then((l) => l.List);
  }, {
    factory: 'createList',
    name: 'List',
    filter: 'vector',
    sizeDependsOnDataDimension: [
      false,
      true
    ]
  });
  registry.push('vis', 'proportionalSymbol', function () {
    return import('./dist/list/proportionalSymbol').then((p) => p.ProportionalSymbol);
  }, {
    factory: 'createProportionalSymbol',
    name: 'Proportional Symbol',
    filter: [
      'vector',
      '(real|int)'
    ],
    sizeDependsOnDataDimension: [
      false,
      true
    ]
  });

  registry.push('vis', 'phovea-vis-heatmap', function () {
    return import('./dist/heatmap/HeatMap').then((h) => h.HeatMap);
  }, {
    factory: 'createRenderer',
    name: 'HeatMap',
    icon: function() { return import('./dist/assets/heatmap_icon.svg'); },
    sizeDependsOnDataDimension: true,
    filter: 'matrix'

  });
  registry.push('vis', 'phovea-vis-heatmap1d', function () {
    return import('./dist/heatmap/HeatMap1D').then((h) => h.HeatMap1D);
  }, {
    factory: 'create1D',
    name: 'HeatMap 1D',
    icon: function() { return import('./dist/assets/heatmap_icon.svg'); },
    sizeDependsOnDataDimension: [
      false,
      true
    ],
    scaling: 'height-only',
    filter: ['vector', '(real|int|categorical)']

  });
  registry.push('vis', 'phovea-vis-kaplanmeier', function () {
    return import('./dist/base/kaplanmeier').then((k) => k.KaplanMeierPlot);
  }, {
    factory: 'createKaplanMeierPlot',
    name: 'Kaplanmeier Plot',
    icon: function() { return import('./dist/assets/kaplanmeier_icon.svg'); },
    sizeDependsOnDataDimension: [
      false,
      false
    ],
    scaling: 'aspect',
    filter: ['vector', 'int']

  });
  registry.push('vis', 'phovea-vis-histogram', function () {
    return import('./dist/distribution/Histogram').then((h) => h.Histogram);
  }, {
    factory: 'createHistrogram',
    name: 'Histogram',
    icon: function() { return import('./dist/assets/distribution_histogram_icon.png'); },
    filter: [
      '(vector|matrix|stratification)',
      '(categorical|real|int)'
    ]

  });
  registry.push('vis', 'phovea-vis-mosaic', function () {
    return import('./dist/distribution/Mosaic').then((m) => m.Mosaic);
  }, {
    name: 'Mosaic',
    factory: 'createMosaic',
    icon: function() { return import('./dist/assets/distribution_mosaic_icon.png'); },
    sizeDependsOnDataDimension: [
      false,
      true
    ],
    scaling: 'height-only',
    filter: [
      '(vector|stratification)',
      'categorical'
    ]

  });
  registry.push('vis', 'phovea-vis-pie', function () {
    return import('./dist/distribution/Pie').then((p) => p.Pie);
  }, {
    name: 'Pie',
    factory: 'createPie',
    icon: function() { return import('./dist/assets/distribution_pie_icon.png'); },
    scaling: 'aspect',
    filter: [
      '(vector|stratification)',
      'categorical'
    ]

  });
  registry.push('vis', 'phovea-vis-box', function () {
    return import('./dist/base/box').then((b) => b.BoxPlot);
  }, {
    factory: 'createBoxPlot',
    name: 'BoxPlot',
    icon: function() { return import('./dist/assets/box_icon.png'); },
    scaling: 'aspect',
    filter: [
      'vector',
      '(real|int)'
    ]

  });
  registry.push('vis', 'force-directed-graph', function () {
    return import('./dist/base/force_directed_graph').then((f) => f.ForceDirectedGraphVis);
  }, {
    factory: 'createForceDirectedGraphVis',
    name: 'Force Directed Graph',
    filter: 'graph',
    icon: function() { return import('./dist/assets/force_directed_graph.svg'); },
    sizeDependsOnDataDimension: [
      false,
      false
    ]

  });
};

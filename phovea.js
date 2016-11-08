/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function(registry) {
  //registry.push('extension-type', 'extension-id', function() { return System.import('./src/extension_impl'); }, {});
  registry.push('vis', 'axis', function () {
    return System.import('./src/axis');
  }, {
    name: 'Axis',
    icon: function() { return System.import('./src/assets/axis_icon.svg'); },
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
    return System.import('./src/barplot');
  }, {
    name: 'Bar Plot',
    icon: function() { return System.import('./src/assets/barplot_icon.png'); },
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
    return System.import('./src/table');
  }, {
    name: 'Table',
    filter: '(matrix|table|vector)',
    sizeDependsOnDataDimension: true

  });
  registry.push('vis', 'scatterplot', function () {
    return System.import('./src/scatterplot');
  }, {
    name: 'ScatterPlot',
    filter: 'matrix'

  });
  registry.push('vis', 'phovea-vis-heatmap', function () {
    return System.import('./src/heatmap');
  }, {
    name: 'HeatMap',
    icon: function() { return System.import('./src/assets/heatmap_icon.svg'); },
    sizeDependsOnDataDimension: true,
    filter: 'matrix'

  });
  registry.push('vis', 'phovea-vis-heatmap1d', function () {
    return System.import('./src/heatmap');
  }, {
    name: 'HeatMap 1D',
    icon: function() { return System.import('./src/assets/heatmap_icon.svg'); },
    sizeDependsOnDataDimension: [
      false,
      true
    ],
    scaling: 'height-only',
    filter: 'vector'

  });
  registry.push('vis', 'phovea-vis-kaplanmeier', function () {
    return System.import('./src/kaplanmeier');
  }, {
    name: 'Kaplanmeier Plot',
    icon: function() { return System.import('./src/assets/kaplanmeier_icon.svg'); },
    sizeDependsOnDataDimension: [
      false,
      false
    ],
    scaling: 'aspect',
    filter: ['vector', 'int']

  });
  registry.push('vis', 'phovea-vis-histogram', function () {
    return System.import('./src/distribution');
  }, {
    name: 'Histogram',
    icon: function() { return System.import('./src/assets/distribution_histogram_icon.png'); },
    filter: [
      '(vector|matrix|stratification)',
      '(categorical|real|int)'
    ]

  });
  registry.push('vis', 'phovea-vis-mosaic', function () {
    return System.import('./src/distribution');
  }, {
    name: 'Mosaic',
    factory: 'createMosaic',
    icon: function() { return System.import('./src/assets/distribution_mosaic_icon.png'); },
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
    return System.import('./src/distribution');
  }, {
    name: 'Pie',
    factory: 'createPie',
    icon: function() { return System.import('./src/assets/distribution_pie_icon.png'); },
    scaling: 'aspect',
    filter: [
      '(vector|stratification)',
      'categorical'
    ]

  });
  registry.push('vis', 'phovea-vis-box', function () {
    return System.import('./src/box');
  }, {
    name: 'BoxPlot',
    icon: function() { return System.import('./src/assets/box_icon.png'); },
    scaling: 'aspect',
    filter: [
      'vector',
      '(real|int)'
    ]

  });
  registry.push('vis', 'force-directed-graph', function () {
    return System.import('./src/force_directed_graph');
  }, {
    name: 'Force Directed Graph',
    filter: 'graph',
    icon: function() { return System.import('./src/assets/force_directed_graph.svg'); },
    sizeDependsOnDataDimension: [
      false,
      false
    ]

  });
};

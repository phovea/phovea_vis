## Caleydo Standard Visualizations ![Caleydo Web Client Plugin](https://img.shields.io/badge/Caleydo%20Web-Client%20Plugin-ff7f00.svg)

Caleydo Web client plugin providing standard visualization techniques (table, heatmap, scatterplot, axis, pie, distribution, ..).

### Supported Visualization Techniques

Axis
 * extension id: `axis`
 * module: `axis.ts`
 * accepts: (real|int) vectors

Bar Plot
 * extension id: `barplot`
 * module: `barplot.ts`
 * accepts: (real|int) vectors

Box Plot
 * extension id: `caleydo-vis-box`
 * module: `box.ts`
 * accepts: (real|int) vectors

Kaplan Meier Plot 
 * extension id: `caleydo-vis-kaplanmeier`
 * module: `kaplanmeier.ts`
 * accepts: int vectors

Table
 * extension id: `table`
 * module: `table.ts`
 * accepts: matrices, tables, and vectors
 
Scatterplot
 * extension id: `scatterplot`
 * module: `scatterplot.ts`
 * accepts: matrices

Histogram 
 * extension id: `caleydo-vis-histogram`
 * module: `distribution.ts`
 * accepts: (categorical|real|int) (vectors|matrix|stratification)

1D HeatMap (caleydo-vis-heatmap1d

TODO
 * Mosaic (caleydo-vis-mosaic)

### Installation

```bash
./manage.sh clone Caleydo/bundle_web
```

*****

<a href="https://caleydo.org"><img src="http://caleydo.org/assets/images/logos/caleydo.svg" align="left" width="200px" hspace="10" vspace="6"></a>
This plugin is part of **[Caleydo Web](http://caleydo.org/)**, a platform for developing web-based visualization applications. For tutorials, API docs, and more information about the build and deployment process, see the [documentation page](http://caleydo.org/documentation).

Caleydo Standard Visualizations ![Caleydo Web Client Plugin](https://img.shields.io/badge/Caleydo%20Web-Client%20Plugin-F47D20.svg)
=====================

Caleydo Web client plugin providing standard visualization techniques (table, heatmap, scatterplot, axis, pie, distribution, ..).

Installation
------------

[Set up a virtual machine using Vagrant](http://www.caleydo.org/documentation/vagrant/) and run these commands inside the virtual machine:

```bash
./manage.sh clone Caleydo/caleydo_vis
./manage.sh resolve
```

If you want this plugin to be dynamically resolved as part of another application of plugin, you need to add it as a peer dependency to the _package.json_ of the application or plugin it should belong to:

```json
{
  "peerDependencies": {
    "caleydo_vis": "*"
  }
}
```

Usage
-------------------

### Supported Visualization Techniques

#### Axis
 * extension id: `axis`
 * module: `axis.ts`
 * accepts: (real|int) vectors

#### Bar Plot
 * extension id: `barplot`
 * module: `barplot.ts`
 * accepts: (real|int) vectors

#### Box Plot
 * extension id: `caleydo-vis-box`
 * module: `box.ts`
 * accepts: (real|int) vectors

#### Kaplan Meier Plot 
 * extension id: `caleydo-vis-kaplanmeier`
 * module: `kaplanmeier.ts`
 * accepts: int vectors

#### Table
 * extension id: `table`
 * module: `table.ts`
 * accepts: matrices, tables, and vectors
 
#### Scatterplot
 * extension id: `scatterplot`
 * module: `scatterplot.ts`
 * accepts: matrices

#### Histogram 
 * extension id: `caleydo-vis-histogram`
 * module: `distribution.ts`
 * accepts: (categorical|real|int) (vectors|matrix|stratification)

#### Mosaic
 * extension id: `caleydo-vis-mosaic`
 * module: `distribution.ts`
 * accepts: (categorical) (vectors|stratification)

#### 2D Heat Map
 * extension id: `caleydo-vis-heatmap`
 * module: `heatmap.ts`
 * accepts: (real|int) matrices
 
#### 1D Heat Map 
 * extension id: `caleydo-vis-heatmap1d`
 * module: `heatmap.ts`
 * accepts: (real|int) vectors


***

<a href="https://caleydo.org"><img src="http://caleydo.org/assets/images/logos/caleydo.svg" align="left" width="200px" hspace="10" vspace="6"></a>
This repository is part of **[Caleydo Web](http://caleydo.org/)**, a platform for developing web-based visualization applications. For tutorials, API docs, and more information about the build and deployment process, see the [documentation page](http://caleydo.org/documentation/).

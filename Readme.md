# Comb Script
## The Best Way to Design a Comb

- [Try it](http://combscript.justinbakse.com/)
- [Docs](http://combscript.justinbakse.com/docs.html)


 # Introduction

CombScript is a language for describing technical vector designs and a tool that exports these designs as SVG files. A primary goal of CombScript is to express designs naturally, so they are easier to adjust and customize.

CombScript was inspired by [OpenSCAD](http://www.openscad.org/), CSS, HTML, and Adobe Illustrator snapping shenanigans.

-	**Parametric**

	Because shapes in CombScript can be positioned relative to the bounds of their parents, it is possible to make designs that flex when dimensions change.

-	**Expressive**

	Positions can be described in multiple ways allowing more natural expression. For example you can specify that a circle is 10 units from the right side of its container and vertically centered, rather than expressing its global coordinates.

-	**Declarative**

	CombScript is more like HTML than JavaScript. Ideally, your document describes your design, not the steps required to make it.

-	**Unstyled**

	Shapes in CombScript represent only the path data and don't have their own style properties like fill-color, stroke-color, or stroke-width. CombScript is primarily designed for designs that describe paths for laser-cutters and plotters where such styles are not needed.

-	**Boolean Operations**

	Combine shapes using boolean operations: Intersection, Union, and Difference

-	**Render to SVG**

	Shape data can be exported as SVG using style templates.

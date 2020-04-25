d3.csv("data.csv").then(createNodeLink);

let keys = ["City", "Zipcode", "Battalion", "Priority"];

function createNodeLink(data_csv) {

  console.log(data_csv);


  let pad = 140;
  let diameter = 700;
  let width = 960;
  let height = 500;

  let svg = d3.select("body").select("svg#nodelinker")
    .style("width", width)
    .style("height", height);
  // setup svg width and height


  // shift (0, 0) a little bit to leave some padding
  let plot = svg.append("g")
    .attr("id", "plot")
    .attr("transform", translate(pad + 300, pad + 100)); //translate(width / 2, (height / 2) ))

  let nested_data = d3.nest()
    .key(function(d) {
      return d["City"];
    })
    .key(function(d) {
      return d["Zipcode of Incident"]
    })
    .key(function(d) {
      return d["Battalion"]
    })
    .key(function(d) {
      return d["Priority"]
    })
    .rollup(function(v) {
      return v.length;
    })
    .entries(data_csv);


  root = nested_data[0].key;

  let data = d3.hierarchy(nested_data[0], function(d) {
      return d.values;
    });

    data.count()
    data.sum(d => d.value);

    data.sort(function(a, b) {
      return b.height - a.height || b.count - a.count;
    });

    let layout = d3.cluster().size([2 * Math.PI, (diameter / 2) - pad]);

    layout(data);

    data.each(function(node) {
      node.theta = node.x;
      node.radial = node.y;

      let point = toCartesian(node.radial, node.theta);
      node.x = point.x;
      node.y = point.y;
    });


    let generator = d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y);

    myColor = d3.scaleOrdinal(d3.schemePaired)
      .domain(keys);

    drawLinks(plot.append("g"), data.links(), generator);
    drawNodes(plot.append("g"), data.descendants(), true);

    svg.append("g")
    .attr("class", "legendLinear")
    .attr("transform", "translate(702,260)")

    var legendLinear = d3.legendColor()
      .shapeWidth(20)
      .shapeHeight(20)
      .cells(4)
      .shapePadding(1)
      .orient('vertical')
      .scale(myColor)


    svg.select(".legendLinear")
      .call(legendLinear);
      svg.append("text").attr("id","legendtitle")
       .attr("x", 772)
       .attr("y",250)
       .style("text-anchor", "middle")
       .style("font-weight", 600)
       .style("font-size", "14px")
       .text("Hierarchy of SFFD");


}
function toCartesian(r, theta) {
    return {
      x: r * Math.cos(theta),
      y: r * Math.sin(theta)
    };
  }


function translate(x, y) {
    return 'translate(' + String(x) + ',' + String(y) + ')';
  }
  function drawLinks(g, links, generator) {
      let paths = g.selectAll('path')
        .data(links)
        .enter()
        .append('path')
        .attr('d', generator)
        .attr('class', 'link');
    }

    function drawNodes(g, nodes, raise) {
      let circles = g.selectAll('circle')
        .data(nodes, node => node.data.key)
        .enter()
        .append('circle')
        .attr('r', 5)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('id', d => d.data.key)
        .text(function(d) {
          return d.data.key;
        })
        .attr('class', 'node')
        .style('fill', function(d){
          console.log(d)
          return myColor(keys[d.depth]);
        })
        .style('stroke', 'black')

      //remove empty circles
      let empty = circles.filter(d => (d.data.key === "")).remove()

      setupEvents(g, circles);
    }

function setupEvents(g, selection) {

    function showTooltip(g, node) {
      let gbox = g.node().getBBox(); // get bounding box of group BEFORE adding text
      let nbox = node.node().getBBox(); // get bounding box of node

      // calculate shift amount
      let dx = nbox.width / 2;
      let dy = nbox.height / 2;

      // retrieve node attributes (calculate middle point)
      let x = nbox.x + dx;
      let y = nbox.y + dy;

      // get data for node
      let datum = node.datum();

      // remove "java.base." from the node name
      let name = datum.data.key;

      // use node name and total size as tooltip text
      numberFormat = d3.format(".2~s");
      let text = `${name} (${numberFormat(datum.value)} cases)`;

      // create tooltip
      let tooltip = g.append('text')
        .text(text)
        .attr('x', x)
        .attr('y', y)
        .attr('dy', -dy - 4) // shift upward above circle
        .attr('text-anchor', 'middle') // anchor in the middle
        .attr('id', 'tooltip')
        .attr('fill', 'red')
        .attr('background-color', 'white');

      // get bounding box for the text
      let tbox = tooltip.node().getBBox();

      // if text will fall off left side, anchor at start
      if (tbox.x < gbox.x) {
        tooltip.attr('text-anchor', 'start');
        tooltip.attr('dx', -dx); // nudge text over from center
      }
      // if text will fall off right side, anchor at end
      else if ((tbox.x + tbox.width) > (gbox.x + gbox.width)) {
        tooltip.attr('text-anchor', 'end');
        tooltip.attr('dx', dx);
      }

      // if text will fall off top side, place below circle instead
      if (tbox.y < gbox.y) {
        tooltip.attr('dy', dy + tbox.height);
      }
    }

    selection.on('mouseover.highlight', function(d) {
    // https://github.com/d3/d3-hierarchy#node_path
    // returns path from d3.select(this) node to selection.data()[0] root node
    let path = d3.select(this).datum().path(selection.data()[0]);

    // select all of the nodes on the shortest path
    let update = selection.data(path, node => node.data.name);

    // highlight the selected nodes
    update.classed('selected', true);

  });

  selection.on('mouseout.highlight', function(d) {
    let path = d3.select(this).datum().path(selection.data()[0]);
    let update = selection.data(path, node => node.data.name);
    update.classed('selected', false);
  });
    // show tooltip text on mouseover (hover)
    selection.on('mouseover.tooltip', function(d) {
      console.log(d);
      let selected = d3.select(this);
      showTooltip(g, d3.select(this));

    })

    // remove tooltip text on mouseout
    selection.on('mouseout.tooltip', function(d) {
      g.select("#tooltip").remove();
    });
  }

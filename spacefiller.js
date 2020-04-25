d3.csv("data.csv").then(createSpace);


let key = ["City", "Zipcode", "Battalion", "Priority"];

function createSpace(data_csv) {

  console.log(data_csv);


  let pad = 140;
  let diameter = 700;
  let width = 960;
  let height = 500;

 //translate(width / 2, (height / 2) ))

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

  console.log("nested_data", nested_data);

  root = nested_data[0].key;
  console.log("root", root);


  myColor = d3.scaleOrdinal(d3.schemePaired)
    .domain(keys);


  let data = d3.hierarchy(nested_data[0], function(d) {
      //console.log("values", d.values);
      return d.values;
    });

    data.count()
    data.sum(d => d.value);

    data.sort(function(a, b) {
      return b.height - a.height || b.count - a.count;
    });


    let layout = d3.partition().padding(5).size([width - 2 * pad, height - 2 * pad]);

    layout(data);

    let svg = d3.select("body").select("svg#spacefiller")
      .style("width", width)
      .style("height", height);
    // setup svg width and height


    // shift (0, 0) a little bit to leave some padding
    let plot = svg.append("g")
      .attr("id", "plot")
      .attr("transform", translate(pad, pad));

    let rects = plot.selectAll("rect")
      .data(data.descendants())
      .enter()
      .append("rect")
      .attr("x", function(d) { return d.x0; })
      .attr("y", function(d) { return d.y0; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .attr("id", function(d) { return d.data.name; })
      .attr("class", "node")
      .style("fill", function(d) {
        console.log(key[d.depth]);
        return myColor(key[d.depth])
      });

      svg.append("g")
      .attr("class", "legendLinear")
      .attr("transform", "translate(70,95)")

      var legendLinear = d3.legendColor()
        .shapeWidth(105)
        .shapeHeight(20)
        .cells(4)
        .shapePadding(5)
        .orient('horizontal')
        .scale(myColor)

        // .title("Avg. Minutes");

      svg.select(".legendLinear")
        .call(legendLinear);
        svg.append("text").attr("id","legendtitle")
         .attr("x", 75)
         .attr("y",85)
         .style("text-anchor", "right")
         .style("font-weight", 600)
         .style("font-size", "14px")
         .text("Levels of SFFD Structure");

         setupEvents(plot, rects);

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
          .attr('id', 'tooltip');

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

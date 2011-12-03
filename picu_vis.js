var w = 960,
    h = 500,
    fill = d3.scale.category20();

var data;

var vis = d3.select("#chart")
  .append("svg:svg")
    .attr("width", w)
    .attr("height", h);

d3.json("patient_data.json", function(json) {
  data = json;

  var temperatureValues = data["Temp Value"];

  // Easily modified to iterate over each array
  createLineGraph("Temperatures", temperatureValues);

});

function createLineGraph(name, values) {

  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%SZ");

  // calculate max and min values in data
  var max=0, min=0;
  var times = new Array();
  for(var row in values) {
      values[row].value = parseFloat(values[row].value);
      values[row].time = timeFormat.parse(values[row].time);
      times[row] = values[row].time;

      min = d3.min([values[row].value, min]);
      max = d3.max([values[row].value, max]);
  }

    
  var h = 200, 
      w = 400,
      p = 30,
      fill = d3.scale.category10(),
      x = d3.time.scale().domain([times[0], times[times.length - 1]]).range([p, w - p]),
      y = d3.scale.linear().domain([min, max]).range([h - p, p]),
      line = d3.svg.line()
                .x(function(d) { return x(d.time); })
                .y(function(d) { return y(d.value); });

  // Create visualization
  var vis = d3.select("#sparkline")
                    .append("svg:svg")
                    .attr("height", h)
                    .attr("width", w);

  // Add tick marks 
  var axisGroup = vis.append("svg:g");

  // x axis tick marks
  axisGroup.selectAll(".xTicks")
    .data(x.ticks(5))
  .enter().append("svg:line")
    .attr("x1", x)
    .attr("x2", x)
    .attr("y1", h - p)
    .attr("y2", h - p + 5)
    .attr("stroke", "black")
    .attr("class", "xTicks");

  // y axis tick marks
  axisGroup.selectAll(".yTicks")
    .data(y.ticks(3))
  .enter().append("svg:line")
    .attr("x1", p - 10)
    .attr("x2", p - 5)
    .attr("y1", y)
    .attr("y2", y)
    .attr("stroke", "black")

  // x tick text
  axisGroup.selectAll("text.yLabels")
    .data(x.ticks(5))
  .enter().append("svg:text")
    .text(x.tickFormat(3))
    .attr("y", h - p + 10)
    .attr("x", x)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle");
   
  // y tick text
  axisGroup.selectAll("text.yLabels")
    .data(y.ticks(3))
  .enter().append("svg:text")
    .text(y.tickFormat(3))
    .attr("y", y)
    .attr("x", p - 12)
    .attr("dy", ".35em")
    .attr("text-anchor", "end");
   

  // Create data line
  var dataLine = vis.append("svg:g");
  // Add data to line
  dataLine.append("svg:path")
    .attr("d", line(values))
    .attr("stroke", "#1f77b4")
    .attr("class", "variable");
  // Add title to line
  dataLine.append("svg:title")
    .text(name);
};

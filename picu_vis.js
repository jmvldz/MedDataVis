// Constants
var MAX_INT = 4294967295;


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
  var sa02 = data["SaO2 (monitor)"];

  // Easily modified to iterate over each array
  createLineGraph("Temperatures", temperatureValues);
  createLineGraph("SaO2 (Monitor)", sa02);

});

function createLineGraph(name, values) {

  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%SZ");

  // calculate max and min values in data
  var max=0, min=MAX_INT;
  var times = new Array();
  for(var row in values) {
      values[row].value = parseFloat(values[row].value);
      values[row].time = timeFormat.parse(values[row].time);
      times[row] = values[row].time;

      min = d3.min([values[row].value, min]);
      max = d3.max([values[row].value, max]);
  }
    
  var h = 100, 
      w = 700,
      p_x = 40;
      p_y = 25,
      fill = d3.scale.category10(),
      x = d3.time.scale().domain([times[0], times[times.length - 1]]).range([p_x, w - p_x]),
      y = d3.scale.linear().domain([.95*min, 1.05*max]).range([h - p_y, p_y]),
      line = d3.svg.line()
                .x(function(d) { return x(d.time); })
                .y(function(d) { return y(d.value); });

  // Create visualization
  var vis = d3.select("#charts")
                    .append("li")
                    .append("div")
                    .append("p").html(name)
                    .append("svg:svg").attr("class", "chart")
                    .attr("height", h)
                    .attr("width", w);

  // Add tick marks 
  var axisGroup = vis.append("svg:g");

  var xTicksNum = 5,
      yTicksNum = 5;

  // x axis
  axisGroup.append("svg:line")
    .attr("x1", p_x - 2)
    .attr("x2", w - p_x - 2)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("class", "axisGroup");

  // y axis 
  axisGroup.append("svg:line")
    .attr("y1", y(d3.min(y.ticks(yTicksNum))) + 8)
    .attr("y2", y(d3.max(y.ticks(yTicksNum))))
    .attr("x1", p_x - 2)
    .attr("x2", p_x - 2)
    .attr("class", "axisGroup");
   
  // x axis tick marks
  axisGroup.selectAll(".xTicks")
    .data(x.ticks(xTicksNum))
  .enter().append("svg:line")
    .attr("x1", x)
    .attr("x2", x)
    .attr("y1", h - p_y)
    .attr("y2", h - p_y + 5)
    .attr("class", "axisGroup");

  // y axis tick marks
  axisGroup.selectAll(".yTicks")
    .data(y.ticks(yTicksNum))
  .enter().append("svg:line")
    .attr("x1", p_x - 10)
    .attr("x2", p_x - 2)
    .attr("y1", y)
    .attr("y2", y)
    .attr("class", "axisGroup");

  // x tick text
  axisGroup.selectAll("text.yLabels")
    .data(x.ticks(xTicksNum))
  .enter().append("svg:text")
    .text(x.tickFormat(3))
    .attr("y", h - p_y + 10)
    .attr("x", x)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle");
   
  // y tick text
  axisGroup.selectAll("text.yLabels")
    .data(y.ticks(yTicksNum))
  .enter().append("svg:text")
    .text(y.tickFormat(3))
    .attr("y", y)
    .attr("x", p_x - 12)
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

  vis.selectAll('.point')
    .data(data)
  .enter().append("svg:circle")
    .attr("cx", (d, i) -> x(time))
    .attr("cy", (d) -> y(d));
};


// Enables dragging of charts
$(function() {
  $("#charts").sortable();
  $("#charts").disableSelection();
});

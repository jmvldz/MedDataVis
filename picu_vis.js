// Constants
var MAX_INT = 4294967295;

var w = 960,
    h = 500,
    fill = d3.scale.category20();

var xTicksNum = 5,
    yTicksNum = 5;

var data;

var vis = d3.select("#chart")
  .append("svg:svg")
    .attr("width", w)
    .attr("height", h);

function sortDates(a, b)
{
    return a.getTime() - b.getTime();
}

d3.json("patient_data.json", function(json) {
  data = json;

  // Parse the time values into date objects
  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%SZ");
  var times = [];
  for(var variable in data) {
      for(var row in variable) {
        if (data[variable][row]) {
          times.push(timeFormat.parse(data[variable][row].time));
        }
      }
  }

  // Get min and max date
  var sorted = times.sort(sortDates);
  var timeDomain = [sorted[0], sorted[sorted.length - 1]];

  // Graph these values
  var temperatureValues = data["Temp Value"];
  var sa02 = data["SaO2 (monitor)"];

  // Easily modified to iterate over each array
  createLineGraph("Temperatures", data["Temp Value"], timeDomain);
  createLineGraph("SaO2 (Monitor)", data["SaO2 (monitor)"], timeDomain);
  createLineGraph("Heart Rate", data["HR"], timeDomain);

  // Graph intervention data
  var interventionData = [];
  var interventionNames = [];
  interventionData.push(data["Dopamine"]);
  interventionNames.push("Dopamine");
  interventionData.push(data["Epinephrine"]);
  interventionNames.push("Epinephrine");
  interventionData.push(data["PT control"]);
  interventionNames.push("PT control");
  createInterventionPlot(interventionData, interventionNames, timeDomain);
});

function createLineGraph(name, values, timeDomain) {

  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%SZ");
  // calculate max and min values in data
  var max=0, min=MAX_INT;
  for(var row in values) {
      values[row].value = parseFloat(values[row].value);
      values[row].time = timeFormat.parse(values[row].time);
      min = d3.min([values[row].value, min]);
      max = d3.max([values[row].value, max]);
  }
    
  var h = 100, 
      w = 700,
      p_x = 40;
      p_y = 25,
      fill = d3.scale.category10(),
      x = d3.time.scale().domain(timeDomain).range([p_x, w - p_x]),
      y = d3.scale.linear().domain([.95*min, 1.05*max]).range([h - p_y, p_y]),
      line = d3.svg.line()
                .x(function(d) { return x(d.time); })
                .y(function(d) { return y(d.value); });

  // Create visualization
  var chart = d3.select("#charts")
                      .append("li")
                      .append("div");
  
  // Add chart name
  chart.append("p")
      .html(name);

  var vis = chart.append("svg:svg").attr("class", "chart")
                    .attr("height", h)
                    .attr("width", w);


  // Add tick marks 
  var axisGroup = vis.append("svg:g");

  // x axis
  axisGroup.append("svg:line")
    .attr("x1", p_x - 2)
    .attr("x2", w - p_x - 2)
    .attr("y1", y(min))
    .attr("y2", y(min))
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
    .attr("y1", y(min))
    .attr("y2", y(min) + 5)
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
    .attr("y", y(min) + 10)
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
    .attr("class", "variable");
  // Add title to line
  dataLine.append("svg:title")
    .text(name);

  dataLine.selectAll('.point')
    .data(values)
  .enter().append("svg:circle")
     .attr("cx", function(d) { return x(d.time); })
     .attr("cy", function(d) { return y(d.value); })
     .attr("r", 2)
     .attr("class", "point");
};

function createInterventionPlot(interventionValues, interventionNames, timeDomain) {
  
  // Parse time values for data
  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%SZ");

  // Set variables
  var h = 200, 
      w = 700,
      p_x = 40,
      p_y = 25,
      p_ordinal = 1.0,
      fill = d3.scale.category10(),
      x = d3.time.scale().domain(timeDomain).range([p_x, w - p_x]),
      y = d3.scale.ordinal().domain(interventionNames)
        .rangePoints([h - p_y, p_y], p_ordinal),
      xAxis = d3.svg.axis().scale(x).ticks(xTicksNum).tickSize(5);

  var chart = d3.select("#charts")
                      .append("li")
                      .append("div");

  var name = "Intervention Data";

  // Add chart name
  chart.append("p")
      .html(name);

  var vis = chart.append("svg:svg").attr("class", "chart")
                    .attr("height", h)
                    .attr("width", w);

  var rects = vis.append("svg:g");
  // Add rectangles for each variable
  for (var variable in interventionValues)
  {
    // Appends rectangles
    rects.selectAll("rect.Shapes")
      .data(interventionValues[variable])
    .enter().append("svg:rect")
      .attr("fill", fill(variable))
      .attr("width", 4)
      .attr("height", 4)
      .attr("x", function (d) { return x(timeFormat.parse(d.time)); })
      .attr("y", y(variable));
  }

  var axisGroup = vis.append("svg:g");

  // Ordinal Y value labels
  axisGroup.selectAll("text.yLabels")
    .data(interventionNames)
  .enter().append("svg:text")
    .text(function (d) { return d; } )
    .attr("y", function (d) { return y(d); })
    .attr("x", p_x)
    .attr("dy", ".35em")
    .attr("class", "text.oLabel");

  // X axis - Using xAxis callback
  axisGroup.append("svg:g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + (h - p_x) + ")")
    .call(xAxis);
}

// Enables dragging of charts
$(function() {
  $("#charts").sortable();
  $("#charts").disableSelection();
});

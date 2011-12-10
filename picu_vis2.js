var m = [80, 80, 80, 80],
    w = 960 - m[1] - m[3],
    h = 300 - m[0] - m[2],
    h0 = m[0];
    parse = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;

// Scales and axes. Note the inverted domain for the y-scale: bigger is up!
var x = d3.time.scale().range([0, w]),
    xConstant = d3.time.scale().range([0, w]),
    y = d3.scale.linear().range([h, 0]),
    xAxis = d3.svg.axis().scale(x).tickSize(-h).tickSubdivide(false),
    // xConstantAxis = d3.svg.axis().scale(xConstant).tickSize(-h).tickSubdivide(false),
    yAxis = d3.svg.axis().scale(y).ticks(4).orient("right");

// An area generator, for the light fill.
var area = d3.svg.area()
    //.interpolate("monotone")
    .x(function(d) { return x(d.time); })
    .y0(h)
    .y1(function(d) { return y(d.value); });

// A line generator, for the dark stroke.
var line = d3.svg.line()
    //.interpolate("monotone")
    .x(function(d) { return x(d.time); })
    .y(function(d) { return y(d.value); });

// List to keep track of charts
chart_data = [];

d3.json("patient_data.json", function(json) {

  var timeDomain = getTotalTimeOfStay(json);

  // Draw timeline
  drawTimeline(timeDomain);

  // Adds text boxes for variable names
  addVariableCheckBoxes(json);

  // Allows toggling the graph on and off
  $('input#variable').click(function () {
    var graphName = $(this).attr("name");
    $('#' + graphName).toggle("slow");
  });

  // Draw charts
  drawChart("Heart Rate", "HR", json["HR"], timeDomain);
  drawChart("Temperature", "Temp Value", json["Temp Value"], timeDomain);
  drawChart("SaO2 (Monitor)", "SaO2 (monitor)", json["SaO2 (monitor)"], timeDomain);

  // Graph intervention data
  var interventionData = [];
  var interventionNames = [];
  interventionData.push(json["Dopamine"]);
  interventionNames.push("Dopamine");
  interventionData.push(json["Epinephrine"]);
  interventionNames.push("Epinephrine");
  interventionData.push(json["PT control"]);
  interventionNames.push("PT control");
  createInterventionPlot(interventionData, interventionNames, timeDomain);

});

function drawTimeline(timeDomain) {

  var h = 50;

  // create svg for the timeline
  var context = d3.select("#timeline")
    .append("svg:svg")
    .attr("height", 50)
    .attr("width", w)
    .append("svg:g")
    .attr("class", "context");

  // X-axis for timeline
  xConstant.domain(timeDomain);

  // Context view.
  context.append("rect")
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .attr("cursor", "crosshair");

  // Context view x axis
  context.append("svg:g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + h + ")");
      // .call(xConstantAxis);

  // Time selector rectangle within context view
  context.append("g")
    .attr("class", "brush")
    .call(d3.svg.brush().x(xConstant)
    .on("brushstart", brushstart)
    .on("brush", function() {

        // set x axis to time chosen by user
        var s = d3.event.target.extent();
        var start = s[0];
        var end = s[1];
        x.domain([start, end]);

        // adjust each chart to the new time range
        for (i = 0; i < chart_data.length; i++) {
          var t = d3.select(".chart"+i).transition().duration(1);
          y.domain([0, d3.max(chart_data[i], function(d) { return d.value; })]).nice();
          t.select(".x_"+i).call(xAxis);
          t.select(".area_"+i).attr("d", area(chart_data[i]));
          t.select(".line_"+i).attr("d", line(chart_data[i]));
        }
    })
    .on("brushend", brushend))
  .selectAll("rect")
    .attr("height", h);

}

function drawChart(readableName, dataName, values, timeDomain) {

  dataName = removeSpaces(dataName);
  dataName = removeParens(dataName);

  // Set check box to checked
  $('input#variable[name=' + dataName + ']').attr('checked', true);

  // Load data
  values.forEach(function(d) {
    d.time = parse(d.time);
    d.value = +d.value;
    d.symbol = readableName;
  });

  // Grab index and store data for resizing charts later
  var index = chart_data.length;
  chart_data.push(values);

  // set x and y
  x.domain(timeDomain);
  y.domain([0, d3.max(values, function(d) { return d.value; })]).nice();

  var svg = d3.select("#charts")
    .append("li")
      .attr("id", dataName)
    .append("div")
    .append("svg:svg")
    .attr("class", "chart" + index)
    .attr("height", h+30) // room for the axis, make a constant later
    .attr("width", w+m[1])
    .append("svg:g");

  // Add the clip path.
  svg.append("svg:clipPath")
      .attr("id", "clip")
    .append("svg:rect")
      .attr("width", w)
      .attr("height", h);

  // Add the area path.
  svg.append("svg:path")
      .attr("class", "area " + "area_" + index)
      .attr("clip-path", "url(#clip)")
      .attr("d", area(values));

  // Add the x-axis.
  svg.append("svg:g")
      .attr("class", "x axis " + "x_" + index)
      .attr("transform", "translate(0," + h + ")")
      .call(xAxis);

  // Add the y-axis.
  svg.append("svg:g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + w + ",0)")
      .call(yAxis);

  // Add the line path.
  svg.append("svg:path")
      .attr("class", "line " + "line_" + index)
      .attr("clip-path", "url(#clip)")
      .attr("d", line(values));

  // Add a small label for the symbol name.
  svg.append("svg:text")
      .attr("x", w - 6)
      .attr("y", h - 6)
      .attr("text-anchor", "end")
      .text(values[0].symbol);
}

function createInterventionPlot(interventionValues, interventionNames, timeDomain) {
  
  // Parse time values for data
  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%SZ");

  // Set variables
  var h = 300, 
      // w = 700,
      p_x = 40,
      p_y = 25,
      p_ordinal = 1.0,
      fill = d3.scale.category10(),
      // x = d3.time.scale().domain(timeDomain).range([p_x, w - p_x]),
      y = d3.scale.ordinal().domain(interventionNames)
        .rangePoints([h - p_y, p_y], p_ordinal);
      // xAxis = d3.svg.axis().scale(x).ticks(xTicksNum).tickSize(5);

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

function sortDates(a, b)
{
    return a.getTime() - b.getTime();
}

// Returns the earliest and latest date for
// patient information
function getTotalTimeOfStay(data) {
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
  return([sorted[0], sorted[sorted.length - 1]]);
}

function brushstart() {
  // svg.classed("selecting", true);
}

function brush() {
  var s = d3.event.target.extent();
  console.log(s[0].toString());
  console.log(s[1].toString());

  // circle.classed("selected", function(d) { return s[0] <= d && d <= s[1]; });
}

function brushend() {
  // svg.classed("selecting", !d3.event.target.empty());
}

// Remove spaces
function removeSpaces(str) {
  return str.replace(/ /, '');
}

// Remove quotes
function removeQuotes(str) {
  return str.replace(/"/, '');
}

// Remove parents
function removeParens(str) {
  return str.replace(/[()]/g, '');
}

// Enables dragging of charts
$(function() {
  $("#charts").sortable();
  $("#charts").disableSelection();
});

// Append a check box for each variable in data
function addVariableCheckBoxes(data) {
  var variableList = $(".variable-selection");

  for(var variable in data) {
    addCheckBox(variableList, variable);
  }
}

function addCheckBox(variableList, variable) {
  var variableID = removeQuotes(variable);
  variableID = removeSpaces(variableID);
  variableID = removeParens(variableID);

  var element = '<li>';
  element += '<input type="checkbox" name="' + variableID
    + '" id="variable" >';
  element += '<span>' + variable + '</span>';
  element += '</li>';

  variableList.append(element);
}

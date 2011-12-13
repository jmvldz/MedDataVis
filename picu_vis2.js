var m = [80, 100, 80, 80],
    w = 960 - m[1] - m[3],
    h = 250 - m[0] - m[2],
    h0 = m[0];
    parse = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;

// Scales and axes. Note the inverted domain for the y-scale: bigger is up!
var x = d3.time.scale().range([0, w]),
    xConstant = d3.time.scale().range([0, w]),
    y = d3.scale.linear().range([h, 0]),
    xAxis = d3.svg.axis().scale(x).tickSize(-h).tickSubdivide(false),
    // xConstantAxis = d3.svg.axis().scale(xConstant).tickSize(-h).tickSubdivide(false),
    yAxis = d3.svg.axis().scale(y).ticks(4).orient("right");

var timeDomain;

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
var chart_data = [];
// Map to keep track of actual data names
var data_names = {};
// Variable to keep track of data
var data;
// Calculated values
var calculatedValues =  ["PaO2 / FiO2", "SaO2 / FiO2"];

d3.json("patient_data.json", function(json) {
  // Keep track of data to add new graphs
  data = json;

  timeDomain = getTotalTimeOfStay(json);

  // Draw timeline
  drawTimeline(timeDomain);

  // Adds text boxes for variable names
  addVariableCheckBoxes(json);
  addCalculatedValues(json);

  // Allows toggling the graph on and off
  $('input#variable').click(toggleGraphOnClick);

  // Draw charts
  drawChart("Heart Rate", "HR", json["HR"], timeDomain);
  drawChart("Temperature", "Temp Value", json["Temp Value"], timeDomain);
  drawChart("SF Ratio", "SaO2 / FiO2", json["SaO2 / FiO2"], timeDomain);
  drawChart("PF Ratio", "PaO2 / FiO2", json["PaO2 / FiO2"], timeDomain);

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

// Appends the graph or hides it on checkbox click
function toggleGraphOnClick() {
  var graphName = $(this).attr("name");
  var graph = $('#' + graphName);
  if(graph.length == 1) {
    graph.toggle('slow');
  }
  else {
    var dataName = data_names[graphName];
    drawChart(dataName, dataName, data[dataName], timeDomain);
  }
}

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

        // Click in the timeline resets timeline
        if (start.toString() == end.toString()) x.domain(timeDomain);

        // adjust each chart to the new time range
        for (i = 0; i < chart_data.length; i++) {
          // var t = d3.select(".chart"+i).transition().duration(1);
          
          y.domain([d3.min(chart_data[i], function(d) { return d.value; })*.9, 
            d3.max(chart_data[i], function(d) { return d.value; })*1.1]).nice();

          var chart = d3.select(".chart-area"+i);
          chart.select(".x_"+i).call(xAxis);
          chart.select(".area_"+i).attr("d", area(chart_data[i]));
          chart.select(".line_"+i).attr("d", line(chart_data[i]));

          chart.selectAll('.point_'+i).remove();
          chart.selectAll('.point_'+i)
            .data(chart_data[i])
            .enter().append("svg:circle")
            .attr("clip-path", "url(#clip)")
            .attr("cx", function(d) { return x(d.time); })
            .attr("cy", function(d) { return y(d.value); })
            .attr("r", 3)
            .attr("class", "point point_" + i);
        }
    })
    .on("brushend", brushend))
  .selectAll("rect")
    .attr("height", h);

}

function drawChart(readableName, dataName, values, timeDomain) {

  dataName = removeNonParsingChars(dataName);

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
  y.domain([d3.min(values, function(d) { return d.value; })*.9, 
  d3.max(values, function(d) { return d.value; })*1.1]).nice();

  var svg = d3.select("#charts")
    .append("li")
      .attr("id", dataName)
    .append("p")
      .html(readableName)
    .append("div")
    .append("svg:svg")
    .attr("class", "chart" + index)
    .attr("height", h+30) // room for the axis, make a constant later
    .attr("width", w+30) // room for the axis, make a constant later
    .append("svg:g")
    .attr("transform", "translate(0," + 10 + ")")
    .attr("class", "chart-area" + index);

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
  // svg.append("svg:text")
  //     .attr("x", w - 6)
  //     .attr("y", h - 6)
  //     .attr("text-anchor", "end")
  //     .text(values[0].symbol);

  // Add dots
  svg.selectAll('.point')
    .data(values)
  .enter().append("svg:circle")
    .attr("clip-path", "url(#clip)")
     .attr("cx", function(d) { return x(d.time); })
     .attr("cy", function(d) { return y(d.value); })
     .attr("r", 3)
     .attr("class", "point point_" + index);
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

// Remove parents
function removeNonParsingChars(str) {
  return str.replace(/[() "/]/g, '');
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
    if(isFinite(data[variable][0].value) && 
      $.inArray(variable, calculatedValues) == -1)
      addCheckBox(variableList, variable);
  }
}

function addCalculatedValues(data) {
  var variableList = $(".calculated-values");

  for(var variable in data) {
    if(isFinite(data[variable][0].value) && 
      $.inArray(variable, calculatedValues) != -1)
      addCheckBox(variableList, variable);
  }
}

// Appends a check box to the variable list for the specified variable
function addCheckBox(variableList, variable) {
  var variableID = removeNonParsingChars(variable);
  
  data_names[variableID] = variable;

  var element = '<li>';
  element += '<input type="checkbox" name="' + variableID
    + '" id="variable" >';
  element += '<span>' + variable + '</span>';
  element += '</li>';

  variableList.append(element);
}


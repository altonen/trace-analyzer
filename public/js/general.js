    $(document).ready(function() {
      $('#tab2-link').click(function() {
          $('#best_and_finalized').empty();
          $('#block_announcements').empty();
          $('#finality_notifications').empty();
          $('#block_import').empty();
          

// set the dimensions and margins of the graph
var margin = { top: 10, right: 100, bottom: 30, left: 80 },
    width = 1000 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#best_and_finalized")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

//Read the data
d3.csv("http://localhost:8000/best-and-finalized",

function(data) {
    var high = 0;
    var low = Number.MAX_SAFE_INTEGER;
    var allGroup = ["best", "finalized"]
    var dataReady = allGroup.map( function(grpName) {
      return {
        name: grpName,
        values: data.map(function(d) {
           let cur = parseInt(d[grpName]);

            if (cur > high) {
              high = cur;
            }
            if (cur < low) {
              low = cur;
            }

          return {date: d3.timeParse("%H:%M:%S.%L")(d.date), value: +d[grpName]};
        })
      };
    });

    var myColor = d3.scaleOrdinal()
      .domain(allGroup)
      .range(d3.schemeSet2);

    var x = d3.scaleTime()
      .domain(d3.extent(data, function(d) { return d3.timeParse("%H:%M:%S.%L")(d.date); }))
      .range([0, width]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%H:%M:%S")));

    var y = d3.scaleLinear()
      .domain([low, high])
      .range([height, 0]);
    svg.append("g")
      .call(d3.axisLeft(y));

    var line = d3.line()
      .x(function(d) { return x(+d.date) })
      .y(function(d) { return y(+d.value) })
    svg.selectAll("myLines")
      .data(dataReady)
      .enter()
      .append("path")
        .attr("d", function(d){ return line(d.values) } )
        .attr("stroke", function(d){ return myColor(d.name) })
        .style("stroke-width", 2)
        .style("fill", "none")

    svg
      .selectAll("myDots")
      .data(dataReady)
      .enter()
        .append('g')
        .style("fill", function(d){ return myColor(d.name) })
      .selectAll("myPoints")
      .data(function(d){ return d.values })
      .enter()
      .append("circle")
        .attr("cx", function(d) {
            return x(d3.timeParse("%H:%M:%S.%L")(d.date))
        })
        .attr("cy", function(d) { return y(d.value) } )
        .attr("r", 5)
        .attr("stroke", "white")

    svg
      .selectAll("myLabels")
      .data(dataReady)
      .enter()
        .append('g')
        .append("text")
          .datum(function(d) { return { name: d.name, value: d.values[d.values.length - 1]}; })
          .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.value) + ")"; })
          .attr("x", 20)
          .attr("y", function(d) {
              if (d.name == "best") {
                return 30
              } else {
                return 50
              }
          })
          .text(function(d) { return d.name; })
          .style("fill", function(d){ return myColor(d.name) })
          .style("font-size", 10)

});



          // set the dimensions and margins of the graph
          var margin = {top: 10, right: 30, bottom: 30, left: 60},
              width = 8000 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;

          // append the svg object to the body of the page
          var svg2 = d3.select("#block_announcements")
            .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

          d3.csv("http://localhost:8000/block-announcements",
            function(d){
              return { date : d3.timeParse("%H:%M:%S.%L")(d.date), value : d.value }
            },
            function(data) {
              var x = d3.scaleTime()
                .domain(d3.extent(data, function(d) { return d.date; }))
                .range([ 0, width ]);
              svg2.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%H:%M:%S")));
              var y = d3.scaleLinear()
                .domain(d3.extent(data, function(d) { return d.value; }))
                .range([height, 0]);
              svg2.append("g")
                .call(d3.axisLeft(y));
              svg2.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "#69b3a2")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                  .x(function(d) { return x(d.date) })
                  .y(function(d) { return y(d.value) })
                  )
              svg2
                .append("g")
                .selectAll("dot")
                .data(data)
                .enter()
                .append("circle")
                  .attr("cx", function(d) { return x(d.date) } )
                  .attr("cy", function(d) { return y(d.value) } )
                  .attr("r", 5)
                  .attr("fill", "#69b3a2")
          });

          
var margin = {top: 10, right: 30, bottom: 30, left: 40},
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg3 = d3.select("#block_import")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// get the data

d3.csv("http://localhost:8000/block-imports", function(data) {

  // X axis: scale and draw:
  var x = d3.scaleLinear()
      .domain([0, 8000])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
      .range([0, width]);
  svg3.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // set the parameters for the histogram
  var histogram = d3.histogram()
      .value(function(d) { return d.duration; })   // I need to give the vector of value
      .domain(x.domain())  // then the domain of the graphic
      .thresholds(x.ticks(70)); // then the numbers of bins

  // And apply this function to data to get the bins
  var bins = histogram(data);

  var y = d3.scaleLinear()
      .range([height, 0]);
      y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
  // var y = d3.scaleLog()
  //     .range([0, height])
  //     .domain([1, 100000]);
  svg3.append("g")
      .call(d3.axisLeft(y));

  // append the bar rectangles to the svg element
  svg3.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) - 1; })
        .attr("height", function(d) { return height - y(d.length); })
        .style("fill", "#69b3a2");

});
      
      });


    });

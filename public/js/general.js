function draw_block_height() {
    var margin = { top: 10, right: 100, bottom: 30, left: 80 };
    var width = 1000 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

    var svg = d3.select("#best_and_finalized")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("http://localhost:8000/best-and-finalized", function(data) {
        var high = 0;
        var low = Number.MAX_SAFE_INTEGER;
        var previous_best = 0;
        var previous_finalized = 0;
        var repeating_best = 0;
        var repeating_best_highest = 0;
        var repeating_finalized = 0;
        var repeating_finalized_highest = 0;

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

                    if (grpName === "best") {
                        if (previous_best == cur) {
                            repeating_best++;
                        } else {
                            if (repeating_best > repeating_best_highest) {
                                repeating_best_highest = repeating_best;
                            }
                            repeating_best = 0;
                        }

                        previous_best = cur;
                    } else {
                        if (previous_finalized == cur) {
                            repeating_finalized++;
                        } else {
                            if (repeating_finalized > repeating_finalized_highest) {
                                repeating_finalized_highest = repeating_finalized;
                            }
                            repeating_finalized = 0;
                        }

                        previous_finalized = cur;
                    }

                    return { date: d3.timeParse("%H:%M:%S.%L")(d.date), value: +d[grpName] };
                })
            };
        });

        if (repeating_best > 10 || repeating_best_highest > 10) {
            $('#best_block').show();
        }

        if (repeating_finalized > 10 || repeating_finalized_highest > 10) {
            $('#finalized_block').show();
        }

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
        svg.append("g").call(d3.axisLeft(y));

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

        svg.selectAll("myDots")
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

        svg.selectAll("myLabels")
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
}

function draw_block_announcements() {
    var margin = {top: 10, right: 30, bottom: 30, left: 80},
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    d3.csv("http://localhost:8000/block-announcements",
        function(d){
            return { date : d3.timeParse("%H:%M:%S.%L")(d.date), value : d.value }
        },
        function(data) {
            if (data.length === 0) {
                $("#block_announcement_info").show();
                return;
            }

            var svg = d3.select("#block_announcements")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

            var x = d3.scaleTime()
                .domain(d3.extent(data, function(d) { return d.date; }))
                .range([ 0, width ]);
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%H:%M:%S")));

            var y = d3.scaleLinear()
                .domain(d3.extent(data, function(d) { return d.value; }))
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "#69b3a2")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function(d) { return x(d.date) })
                    .y(function(d) { return y(d.value) })
                )

            svg
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
}

function draw_block_import() {
    var margin = { top: 10, right: 30, bottom: 30, left: 40 };
    var width = 800 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

    var svg = d3.select("#block_import")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("http://localhost:8000/block-imports", function(data) {

        let slow_import_count = 0;
        for (var value in data) {
            if (data[value] >= 1000) {
                slow_import_count++;                
            }
        }

        // TODO: maybe not the best metric?
        if (slow_import_count > 5) {
            $('#slow_block_import').show();
        }

        var x = d3.scaleLinear()
            .domain([0, 8000])
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        var histogram = d3.histogram()
            .value(function(d) { return d.duration; })
            .domain(x.domain())
            .thresholds(x.ticks(70));

        var bins = histogram(data);

        var y = d3.scaleLinear()
            .range([height, 0]);
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);
        // var y = d3.scaleLog()
        //     .range([0, height])
        //     .domain([1, 100000]);

        svg.append("g").call(d3.axisLeft(y));
        svg.selectAll("rect")
           .data(bins)
           .enter()
           .append("rect")
           .attr("x", 1)
           .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
           .attr("width", function(d) { return x(d.x1) - x(d.x0) - 1; })
           .attr("height", function(d) { return height - y(d.length); })
           .style("fill", "#69b3a2");
    });
}

$(document).ready(function() {
    $('#tab2-link').click(function() {
        $('#best_and_finalized').empty();
        $('#block_announcements').empty();
        $('#finality_notifications').empty();
        $('#block_import').empty();

        draw_block_height();
        draw_block_announcements();
        draw_block_import();
    });
});

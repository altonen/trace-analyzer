function draw_messages_sent_received() {
    var margin = { top: 10, right: 100, bottom: 30, left: 80 };
    var width = 1000 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    d3.csv("http://localhost:8000/grandpa-msg", function(data) {
        var high = 0;
        var low = Number.MAX_SAFE_INTEGER;
        var allGroup = ["sent", "received"]
        var total = 0;

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
                    total += +d[grpName];

                    return { date: d3.timeParse("%H:%M:%S.%L")(d.date), value: +d[grpName] };
                })
            };
        });

        // if no bytes were sent, show an info box instead
        if (total === 0) {
            $('#grandpa_messages_sent_received_info').show();
            return;
        } else {
            $('#grandpa_messages_sent_received_info').hide();
        }

        var svg = d3.select("#grandpa_messages_sent_received")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
            .domain([low * 0.9, high * 1.10])
            .range([height, 0]);
        svg.append("g").call(d3.axisLeft(y));

        var line = d3.line()
            .x(function(d) { return x(+d.date) })
            .y(function(d) { return y(+d.value) })
        svg
            .selectAll("myLines")
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

        svg.append("text")
            .attr("x", 10)
            .attr("y", 0)
            .text("sent")
            .attr("font-size", "12px")
            .attr("fill", myColor("sent"));

        svg.append("text")
            .attr("x", 10)
            .attr("y", 15)
            .text("received")
            .attr("font-size", "12px")
            .attr("fill", myColor("received"));
    });
}

function draw_bytes_sent_received() {
    var margin = { top: 10, right: 100, bottom: 30, left: 80 };
    var width = 1000 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    d3.csv("http://localhost:8000/grandpa-bytes", function(data) {
        var high = 0;
        var low = Number.MAX_SAFE_INTEGER;
        var allGroup = ["sent", "received"]
        var total = 0;

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
                    total += +d[grpName];

                    return { date: d3.timeParse("%H:%M:%S.%L")(d.date), value: +d[grpName] };
                })
            };
        });

        // if no bytes were sent, show an info box instead
        if (total === 0) {
            $('#grandpa_bytes_sent_received_info').show();
            return;
        } else {
            $('#grandpa_bytes_sent_received_info').hide();
        }

        var svg = d3.select("#grandpa_bytes_sent_received")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
            .domain([low * 0.9, high * 1.10])
            .range([height, 0]);
        svg.append("g").call(d3.axisLeft(y));

        var line = d3.line()
            .x(function(d) { return x(+d.date) })
            .y(function(d) { return y(+d.value) })
        svg
            .selectAll("myLines")
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

        svg.append("text")
            .attr("x", 10)
            .attr("y", 0)
            .text("sent")
            .attr("font-size", "12px")
            .attr("fill", myColor("sent"));

        svg.append("text")
            .attr("x", 10)
            .attr("y", 15)
            .text("received")
            .attr("font-size", "12px")
            .attr("fill", myColor("received"));
    });
}

$(document).ready(function() {
    $('#tab6-link').click(function() {
        $('#grandpa_messages_sent_received').empty();
        $('#grandpa_bytes_sent_received').empty();

        console.log("here")

        draw_bytes_sent_received();
        draw_messages_sent_received();
    });
});

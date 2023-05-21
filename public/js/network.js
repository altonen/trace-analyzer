// draw peer graph count
function draw_peer_graph() {
    var margin = { top: 30, right: 30, bottom: 50, left: 60 };
    var width  = 800 - margin.left - margin.right;
    var height = 600 - margin.top - margin.bottom;

    var svg = d3.select("#peer_count")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("http://localhost:8000/peer-info",
        function(d){
            return { date : d3.timeParse("%H:%M:%S.%L")(d.date), value : d.value }
        },
        function(data) {
            var x = d3.scaleTime()
                .domain(d3.extent(data, function(d) { return d.date; }))
                .range([0, width]);
            var y = d3.scaleLinear()
                .domain([0, 50])
                .range([height, 0]);

            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%H:%M:%S")));
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
            );

            svg
                .append("g")
                .selectAll("dot")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", function(d) { return x(d.date) })
                .attr("cy", function(d) { return y(d.value) })
                .attr("r", 5)
                .attr("fill", "#69b3a2")
    });
}

function draw_sent_bytes() {
    var margin = { top: 0, right: 100, bottom: 30, left: 80 };
    var width = 1000 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    var svg = d3.select("#bytes_sent")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("http://localhost:8000/sent-bytes", function(data) {
        var high = 0;
        var low = Number.MAX_SAFE_INTEGER;
        var allGroup = ["block-announces", "grandpa", "transactions"]
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

                    return { date: d3.timeParse("%H:%M:%S.%L")(d.date), value: +d[grpName] };
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

        svg
            .selectAll("myLabels")
            .data(dataReady)
            .enter()
            .append('g')
            .append("text")
            .datum(function(d) { return { name: d.name, value: d.values[d.values.length - 1]}; })
            .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.value) + ")"; })
            .attr("x", -65)
            .attr("y", function(d) {
                if (d.name == "grandpa") {
                    return -300
                } else if (d.name == "block-announces") {
                    return -280
                }
                return -260
            })
            .text(function(d) { return d.name; })
            .style("fill", function(d){ return myColor(d.name) })
            .style("font-size", 10)
    });
}

function draw_sent_messages() {
    var margin = { top: 0, right: 100, bottom: 30, left: 80 };
    var width = 1000 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    var svg = d3.select("#messages_sent")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("http://localhost:8000/sent-messages", function(data) {
        var high = 0;
        var low = Number.MAX_SAFE_INTEGER;
        var allGroup = ["block-announces", "grandpa", "transactions"]
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

                    return { date: d3.timeParse("%H:%M:%S.%L")(d.date), value: +d[grpName] };
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

        svg
            .selectAll("myLabels")
            .data(dataReady)
            .enter()
            .append('g')
            .append("text")
            .datum(function(d) { return { name: d.name, value: d.values[d.values.length - 1]}; })
            .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.value) + ")"; })
            .attr("x", -65)
            .attr("y", function(d) {
                if (d.name == "grandpa") {
                    return -300
                } else if (d.name == "block-announces") {
                    return -280
                }
                return -260
            })
            .text(function(d) { return d.name; })
            .style("fill", function(d){ return myColor(d.name) })
            .style("font-size", 10)
    });
}

function draw_received_bytes() {
    var margin = { top: 10, right: 100, bottom: 30, left: 80 };
    var width = 1000 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

    var svg = d3.select("#bytes_received")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("http://localhost:8000/received-bytes", function(data) {
        var high = 0;
        var low = Number.MAX_SAFE_INTEGER;
        var allGroup = ["block-announces", "grandpa", "transactions"]
        var dataReady = allGroup.map(function(grpName) {
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

                    return { date: d3.timeParse("%H:%M:%S.%L")(d.date), value: +d[grpName] };
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
            .domain([low * 0.98, high * 1.02])
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
           .attr("x", -65)
           .attr("y", function(d) {
               if (d.name == "grandpa") {
                   return -300
               } else if (d.name == "block-announces") {
                   return -280
               }
               return -260
           })
           .text(function(d) { return d.name; })
           .style("fill", function(d){ return myColor(d.name) })
           .style("font-size", 10)
    });
}

function draw_received_messages() {
    var margin = { top: 10, right: 100, bottom: 30, left: 80 };
    var width = 1000 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

    var svg = d3.select("#messages_received")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("http://localhost:8000/received-messages", function(data) {
        var high = 0;
        var low = Number.MAX_SAFE_INTEGER;
        var allGroup = ["block-announces", "grandpa", "transactions"]
        var dataReady = allGroup.map(function(grpName) {
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

                    return { date: d3.timeParse("%H:%M:%S.%L")(d.date), value: +d[grpName] };
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
            .domain([low * 0.98, high * 1.02])
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
           .attr("x", -65)
           .attr("y", function(d) {
               if (d.name == "grandpa") {
                   return -300
               } else if (d.name == "block-announces") {
                   return -280
               }
               return -260
           })
           .text(function(d) { return d.name; })
           .style("fill", function(d){ return myColor(d.name) })
           .style("font-size", 10)
    });
}

function draw_connectivity_donut() {
    var width  = 900
    var height = 600;
    var margin = 0;

    var radius = Math.min(width, height) / 2 - margin;

    var svg = d3.select("#connectivity")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    d3.json("http://localhost:8000/connectivity", function(data) {
        var color = d3.scaleOrdinal()
            .domain(["failed_to_reach", "disconnected", "unique_dials", "unique_conns"])
            .range(d3.schemeDark2);

        var pie = d3.pie()
            .sort(null)
            .value(function(d) {return d.value; })
        var data_ready = pie(d3.entries(data))

        var arc = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius * 0.8)

        var outerArc = d3.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9)

        svg.selectAll('allSlices')
            .data(data_ready)
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', function(d){ return(color(d.data.key)) })
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", 0.7)

        svg.selectAll('allPolylines')
            .data(data_ready)
            .enter()
            .append('polyline')
            .attr("stroke", "black")
            .style("fill", "none")
            .attr("stroke-width", 1)
            .attr('points', function(d) {
                var posA = arc.centroid(d);
                var posB = outerArc.centroid(d);
                var posC = outerArc.centroid(d);
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                posC[0] = radius * 0.89 * (midangle < Math.PI ? 1 : -1);
                return [posA, posB, posC]
            });

        svg.selectAll('allLabels')
            .data(data_ready)
            .enter()
            .append('text')
            .text( function(d) { return d.data.key.replace(/_/g, ' ') + ": " + d.data.value} )
            .attr('transform', function(d) {
                var pos = outerArc.centroid(d);
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                pos[0] = radius * 0.90 * (midangle < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            })
            .style('text-anchor', function(d) {
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                return (midangle < Math.PI ? 'start' : 'end')
        })
    });
}

$(document).ready(function() {
    $('#tab3-link').click(function() {
        $('#peer_count').empty();
        $('#bytes_sent').empty();
        $('#bytes_received').empty();
        $('#messages_sent').empty();
        $('#messages_received').empty();
        $('#connectivity').empty();

        draw_peer_graph();
        draw_sent_bytes();
        draw_received_bytes();
        draw_sent_messages();
        draw_received_messages();
        draw_connectivity_donut();
    });
});

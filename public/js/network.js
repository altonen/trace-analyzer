// draw peer graph count
function draw_peer_graph() {
    var margin = { top: 30, right: 30, bottom: 50, left: 60 };
    var width  = 800 - margin.left - margin.right;
    var height = 350 - margin.top - margin.bottom;

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
            let peer_counts = 0;
            for (var value in data) {
                if (data[value].value !== undefined) {
                    peer_counts += parseInt(data[value].value);
                }
            }

            if (peer_counts / data.length < 30.0) {
                $("#peer_count_warn").show();
            }

            var x = d3.scaleTime()
                .domain(d3.extent(data, function(d) { return d.date; }))
                .range([0, width]);
            var y = d3.scaleLinear()
                .domain([0, 45])
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

    d3.csv("http://localhost:8000/sent-bytes", function(data) {
        var high = 0;
        var low = Number.MAX_SAFE_INTEGER;
        var allGroup = ["block-announces", "grandpa", "transactions"]
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
            $('#bytes_sent_info').show();
            return;
        }

        var svg = d3.select("#bytes_sent")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

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

    d3.csv("http://localhost:8000/sent-messages", function(data) {
        var high = 0;
        var low = Number.MAX_SAFE_INTEGER;
        var allGroup = ["block-announces", "grandpa", "transactions"]
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

        if (total === 0) {
            $('#messages_sent_info').show();
            return;
        }

        var svg = d3.select("#messages_sent")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

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

    d3.csv("http://localhost:8000/received-bytes", function(data) {
        var high = 0;
        var low = Number.MAX_SAFE_INTEGER;
        var allGroup = ["block-announces", "grandpa", "transactions"]
        var total = 0;

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
                    total += +d[grpName];

                    return { date: d3.timeParse("%H:%M:%S.%L")(d.date), value: +d[grpName] };
                })
            };
        });

        if (total === 0) {
            $('#bytes_received_info').show();
            return;
        }

        var svg = d3.select("#bytes_received")
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
        var total = 0;

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
                    total += +d[grpName];

                    return { date: d3.timeParse("%H:%M:%S.%L")(d.date), value: +d[grpName] };
                })
            };
        });

        if (total === 0) {
            $('#messages_received_info').show();
            return;
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
    d3.json("http://localhost:8000/connectivity", function(data) {
        var total = 0;
        for (var value in data) {
            total += data[value];
        }

        if (total === 0) {
            console.log(total);
            $('#connectivity_info').show();
            return;
        }

        draw_donut(
            data,
            500,
            200,
            10,
            "#connectivity",
            ["failed_to_reach", "disconnected", "unique_dials", "unique_conns"]
        );
    });
}

function draw_roles_donut() {
    d3.json("http://localhost:8000/roles", function(data) {
        var total = 0;
        for (var value in data) {
            total += data[value];
        }
        if (total === 0) {
            $('#role_info').show();
            return;
        }

        draw_donut(
            data,
            500,
            200,
            10,
            "#roles",
            ["dialer", "listener"]
        );
    });
}

function draw_address_donut() {
    d3.json("http://localhost:8000/addresses", function(data) {
        var total = 0;
        for (var value in data) {
            total += data[value];
        }
        if (total === 0) {
            $('#address_info').show();
            return;
        }

        draw_donut(
            data,
            500,
            200,
            10,
            "#addresses",
            ["dns", "ip4", "ip6"]
        );
    });
}

function draw_substream_bars() {
    var margin = { top: 10, right: 30, bottom: 20, left: 50 };
    var width = 600 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

    d3.csv("http://localhost:8000/substreams", function(data) {
        var block_announce = parseInt(data[0].success) + parseInt(data[0].failure);
        var transactions = parseInt(data[1].success) + parseInt(data[1].failure);
        var grandpa = parseInt(data[2].success) + parseInt(data[2].failure);
        var max = Math.max(block_announce, Math.max(transactions, grandpa));

        var svg = d3.select("#substream_open_results")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // List of subgroups = header of the csv files = soil condition here
        var subgroups = data.columns.slice(1)

        // List of groups = species here = value of the first column called group -> I show them on the X axis
        var groups = d3.map(data, function(d){ return(d.group) }).keys()

        // Add X axis
        var x = d3.scaleBand()
            .domain(groups)
            .range([0, width])
            .padding([0.2])
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickSizeOuter(0));

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, max])
            // .domain(d3.extent(data, function(d) { return d.date; }))
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        // color palette = one color per subgroup
        var color = d3.scaleOrdinal()
            .domain(subgroups)
            .range(['#4daf4a', '#e41a1c'])

        //stack the data? --> stack per subgroup
        var stackedData = d3.stack()
            .keys(subgroups)(data);

        // Show the bars
        svg.append("g")
            .selectAll("g")
            // Enter in the stack data = loop key per key = group per group
            .data(stackedData)
            .enter().append("g")
            .attr("fill", function(d) { return color(d.key); })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(function(d) { return d; })
            .enter().append("rect")
            .attr("x", function(d) { return x(d.data.group); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("height", function(d) { return y(d[0]) - y(d[1]); })
            .attr("width",x.bandwidth())
    })
}

$(document).ready(function() {
    $('#tab3-link').click(function() {
        $('#peer_count').empty();
        $('#bytes_sent').empty();
        $('#bytes_received').empty();
        $('#messages_sent').empty();
        $('#messages_received').empty();
        $('#connectivity').empty();
        $('#roles').empty();
        $('#addresses').empty();
        $('#substream_open_results').empty();

        draw_peer_graph();
        draw_sent_bytes();
        draw_received_bytes();
        draw_sent_messages();
        draw_received_messages();
        draw_connectivity_donut();
        draw_substream_bars();
        draw_roles_donut();
        draw_address_donut();
    });
});

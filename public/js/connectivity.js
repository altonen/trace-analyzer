// draw peer graph count
function draw_peer_graph() {
    var margin = { top: 30, right: 30, bottom: 50, left: 60 };
    var width  = 900 - margin.left - margin.right;
    var height = 550 - margin.top - margin.bottom;

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
            } else {
                $("#peer_count_warn").hide();
            }

            var x = d3.scaleTime()
                .domain(d3.extent(data, function(d) { return d.date; }))
                .range([ 0, width ]);
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%H:%M:%S")));

            var y = d3.scaleLinear()
                .domain([0, 45])
                .range([height, 0]);

            svg.append("g")
                .call(d3.axisLeft(y));

            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function(d) { return x(d.date) })
                    .y(function(d) { return y(d.value) })
                )
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
        } else {
            $('#connectivity_info').hide();
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
        } else {
            $('#role_info').hide();
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
        } else {
            $('#address_info').hide();
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

        if (max === 0) {
            $('#substream_info').show();
            return;
        } else {
            $('#substream_info').hide();
        }

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
        $('#connectivity').empty();
        $('#roles').empty();
        $('#addresses').empty();
        $('#substream_open_results').empty();

        draw_peer_graph();
        draw_connectivity_donut();
        draw_substream_bars();
        draw_roles_donut();
        draw_address_donut();
    });
});

function draw_connectivity_bars() {
    var margin = { top: 10, right: 30, bottom: 20, left: 50 };
    var width = 600 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

    d3.csv("http://localhost:8000/sync-connectivity", function(data) {
        var connected = parseInt(data[0].total) + parseInt(data[0].unique);
        var disconnected = parseInt(data[1].total) + parseInt(data[1].unique);
        var evicted = parseInt(data[2].total) + parseInt(data[2].unique);
        var max = Math.max(connected, Math.max(disconnected, evicted));

        var svg = d3.select("#sync_connectivity")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var subgroups = data.columns.slice(1)

        var groups = d3.map(data, function(d){ return(d.group) }).keys()

        var x = d3.scaleBand()
            .domain(groups)
            .range([0, width])
            .padding([0.2])
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickSizeOuter(0));

        var y = d3.scaleLinear()
            .domain([0, max])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        var color = d3.scaleOrdinal()
            .domain(subgroups)
            .range(['#ADD8E6', 'orange'])

        var stackedData = d3.stack()
            .keys(subgroups)(data);

        svg.append("g")
            .selectAll("g")
            .data(stackedData)
            .enter().append("g")
            .attr("fill", function(d) { return color(d.key); })
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter().append("rect")
            .attr("x", function(d) { return x(d.data.group); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("height", function(d) { return y(d[0]) - y(d[1]); })
            .attr("width",x.bandwidth())
    })
}

$(document).ready(function() {
    $('#tab5-link').click(function() {
        $('#sync_connectivity').empty();

        draw_connectivity_bars();
    });
});

// Fetch the data
const DATASET_URL = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';

// Set up the dimensions and margins
const margin = { top: 60, right: 60, bottom: 100, left: 100 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#chart-container')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Create tooltip div
const tooltip = d3.select('body')
    .append('div')
    .attr('id', 'tooltip')
    .style('opacity', 0);

// Color scale for the heat map
const colors = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'];

// Fetch and process the data
d3.json(DATASET_URL).then(data => {
    const baseTemp = data.baseTemperature;
    const monthlyData = data.monthlyVariance;

    // Process the data
    const years = [...new Set(monthlyData.map(d => d.year))];
    const months = [...Array(12).keys()];

    // Create scales
    const xScale = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .padding(0);

    const yScale = d3.scaleBand()
        .domain(months)
        .range([0, height])
        .padding(0);

    const tempExtent = d3.extent(monthlyData, d => baseTemp + d.variance);
    const colorScale = d3.scaleQuantile()
        .domain(tempExtent)
        .range(colors);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .tickValues(xScale.domain().filter(year => year % 10 === 0));

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(month => {
            const date = new Date(0);
            date.setUTCMonth(month);
            return d3.timeFormat('%B')(date);
        });

    // Add x-axis
    svg.append('g')
        .attr('id', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll('text')
        .style('text-anchor', 'middle');

    // Add y-axis
    svg.append('g')
        .attr('id', 'y-axis')
        .call(yAxis);

    // Create the heat map cells
    svg.selectAll('rect')
        .data(monthlyData)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.month - 1))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('data-month', d => d.month - 1)
        .attr('data-year', d => d.year)
        .attr('data-temp', d => baseTemp + d.variance)
        .style('fill', d => colorScale(baseTemp + d.variance))
        .on('mouseover', (event, d) => {
            const date = new Date(0);
            date.setUTCMonth(d.month - 1);
            const monthName = d3.timeFormat('%B')(date);
            
            tooltip.style('opacity', 0.9)
                .html(`
                    <strong>${d.year} - ${monthName}</strong><br/>
                    Temperature: ${(baseTemp + d.variance).toFixed(2)}°C<br/>
                    Variance: ${d.variance.toFixed(2)}°C
                `)
                .attr('data-year', d.year)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            tooltip.style('opacity', 0);
        });

    // Create legend
    const legendWidth = 400;
    const legendHeight = 30;
    const legendThresholds = colorScale.quantiles();
    
    const legendScale = d3.scaleLinear()
        .domain([tempExtent[0], tempExtent[1]])
        .range([0, legendWidth]);

    const legend = svg.append('g')
        .attr('id', 'legend')
        .attr('transform', `translate(${(width - legendWidth) / 2},${height + 50})`);

    // Create legend rectangles
    legend.selectAll('rect')
        .data(colors)
        .enter()
        .append('rect')
        .attr('x', (d, i) => i * (legendWidth / colors.length))
        .attr('width', legendWidth / colors.length)
        .attr('height', legendHeight)
        .style('fill', d => d);

    // Add legend axis
    const legendAxis = d3.axisBottom(legendScale)
        .tickFormat(d3.format('.1f'))
        .tickValues(legendThresholds);

    legend.append('g')
        .attr('transform', `translate(0,${legendHeight})`)
        .call(legendAxis);
}); 
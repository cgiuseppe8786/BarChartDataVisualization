const url =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json";

const svg = d3.select("#chart");
const width = +svg.attr("width");
const height = +svg.attr("height");

const margin = { top: 30, right: 40, bottom: 60, left: 60 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const g = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

d3.json(url).then((data) => {
  const dataset = data.data;

  // Extract dates and values
  const dates = dataset.map((d) => new Date(d[0]));
  const gdps = dataset.map((d) => d[1]);

  // Scales
  const xScale = d3
    .scaleTime()
    .domain([d3.min(dates), d3.max(dates)])
    .range([0, innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(gdps)])
    .range([innerHeight, 0]);

  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).ticks(10).tickFormat((d) => d + "B");

  // Draw axes
  g.append("g")
    .attr("id", "x-axis")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis);

  g.append("g").attr("id", "y-axis").attr("class", "axis").call(yAxis);

  // Y-axis label
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .attr("class", "y-label")
    .text("Gross Domestic Product, billions USD");

  // Bar width
  const barWidth = innerWidth / dataset.length;

  // Bars
  g.selectAll(".bar")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("data-date", (d) => d[0])
    .attr("data-gdp", (d) => d[1])
    .attr("x", (d) => xScale(new Date(d[0])))
    .attr("y", (d) => yScale(d[1]))
    .attr("width", barWidth)
    .attr("height", (d) => innerHeight - yScale(d[1]))
    .on("mouseover", function (event, d) {
      const [dateStr, gdp] = d;
      const date = new Date(dateStr);
      const quarter = "Q" + (Math.floor(date.getMonth() / 3) + 1).toString();

      tooltip
        .style("opacity", 1)
        .attr("data-date", dateStr)
        .html(
          `<strong>${date.getFullYear()} ${quarter}</strong>$${gdp.toLocaleString(
            "en-US"
          )} Billion`
        );

      const offsetX = 20;
      const offsetY = -40;
      const { pageX, pageY } = event;
      tooltip
        .style("left", pageX + offsetX + "px")
        .style("top", pageY + offsetY + "px");
    })
    .on("mousemove", function (event) {
      const offsetX = 20;
      const offsetY = -40;
      const { pageX, pageY } = event;
      tooltip
        .style("left", pageX + offsetX + "px")
        .style("top", pageY + offsetY + "px");
    })
    .on("mouseout", function () {
      tooltip.style("opacity", 0);
    });
});

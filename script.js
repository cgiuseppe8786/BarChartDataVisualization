// URL dati FCC
const url =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json";

document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // 1) GESTIONE TEMA
  // -------------------------------
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    body.dataset.theme = savedTheme;
    themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    body.dataset.theme = prefersDark ? "dark" : "light";
    themeToggle.textContent = prefersDark ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const isDark = body.dataset.theme === "dark";
    body.dataset.theme = isDark ? "light" : "dark";
    localStorage.setItem("theme", body.dataset.theme);
    themeToggle.textContent = isDark ? "🌙" : "☀️";
  }

  themeToggle.addEventListener("click", toggleTheme);
  themeToggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") toggleTheme();
  });

  // -------------------------------
  // 2) D3 BAR CHART
  // -------------------------------
  const svg = d3.select("#chart");

  const width = 960;
  const height = 500;
  svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");

  const margin = { top: 30, right: 40, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("#tooltip");

  d3.json(url).then((data) => {
    const dataset = data.data;

    const dates = dataset.map((d) => new Date(d[0]));
    const gdps = dataset.map((d) => d[1]);

    const xScale = d3
      .scaleTime()
      .domain([d3.min(dates), d3.max(dates)])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(gdps)])
      .range([innerHeight, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(10).tickFormat((d) => d + "B");

    g.append("g")
      .attr("id", "x-axis")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis);

    g.append("g").attr("id", "y-axis").attr("class", "axis").call(yAxis);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .attr("class", "y-label")
      .text("Gross Domestic Product, billions USD");

    const barWidth = innerWidth / dataset.length;


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
        const quarter = "Q" + (Math.floor(date.getMonth() / 3) + 1);

        tooltip
          .style("opacity", 1)
          .attr("data-date", dateStr)
          .html(
            `<strong>${date.getFullYear()} ${quarter}</strong>$${gdp.toLocaleString(
              "en-US"
            )} Billion`
          );
      })
      .on("mousemove", function (event) {
        const container = document.getElementById("container");
        const box = container.getBoundingClientRect();
        const ttBox = tooltip.node().getBoundingClientRect();

        let left = event.clientX - box.left + 15;
        let top = event.clientY - box.top - ttBox.height - 10;

        if (top < 0) {
          top = event.clientY - box.top + 16;
        }

        const padding = 8;
        if (left < padding) left = padding;
        if (left + ttBox.width > box.width - padding) {
          left = box.width - ttBox.width - padding;
        }

        tooltip.style("left", left + "px").style("top", top + "px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });



  });
});

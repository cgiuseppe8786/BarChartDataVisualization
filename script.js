// ============================================================
// SOURCE DATI
// - URL con serie storica GDP
// - Restituisce un JSON con proprietà .data = [ [date, gdp], ... ]
// ============================================================
const url =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json";

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================
  // 1) GESTIONE TEMA (stesso approccio del progetto precedente)
  // - Lettura tema salvato in localStorage
  // - Fallback su prefers-color-scheme
  // - Toggle via click o tastiera
  // ==========================================================
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  // Se l’utente ha già scelto un tema in passato, rispettiamolo
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    body.dataset.theme = savedTheme;
    themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
  } else {
    // Altrimenti partiamo dalla preferenza di sistema
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    body.dataset.theme = prefersDark ? "dark" : "light";
    themeToggle.textContent = prefersDark ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const isDark = body.dataset.theme === "dark";
    body.dataset.theme = isDark ? "light" : "dark";
    localStorage.setItem("theme", body.dataset.theme);
    // Aggiorniamo anche l’icona per feedback visivo immediato
    themeToggle.textContent = isDark ? "🌙" : "☀️";
  }

  // Click con mouse
  themeToggle.addEventListener("click", toggleTheme);
  // Accessibilità: Invio o barra spaziatrice su elemento focusable
  themeToggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") toggleTheme();
  });

  // ==========================================================
  // 2) COSTRUZIONE BAR CHART CON D3
  // ==========================================================
  const svg = d3.select("#chart");

  // Dimensioni base SVG (useremo viewBox per renderlo fluido)
  const width = 960;
  const height = 500;
  svg
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Margini per lasciare spazio ad assi e label
  const margin = { top: 30, right: 40, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Gruppo contenitore interno (tutto il grafico vive qui dentro)
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Tooltip (div assoluto già presente in HTML)
  const tooltip = d3.select("#tooltip");

  // ----------------------------------------------------------
  // Fetch dati (d3.json ritorna una Promise)
  // ----------------------------------------------------------
  d3.json(url).then((data) => {
    // Array tipo: [ ["1947-01-01", 243.1], ... ]
    const dataset = data.data;

    // Pre-elaboriamo array di date e array di valori per convenienza
    const dates = dataset.map((d) => new Date(d[0]));
    const gdps = dataset.map((d) => d[1]);

    // --------------------------------------------------------
    // SCALE
    // --------------------------------------------------------
    // Asse X: temporale, dal minimo al massimo della serie
    const xScale = d3
      .scaleTime()
      .domain([d3.min(dates), d3.max(dates)])
      .range([0, innerWidth]);

    // Asse Y: lineare, da 0 al GDP massimo
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(gdps)])
      .range([innerHeight, 0]);

    // --------------------------------------------------------
    // ASSI
    // --------------------------------------------------------
    const xAxis = d3.axisBottom(xScale);
    // Mostriamo valore + "B" (billions) per chiarezza
    const yAxis = d3.axisLeft(yScale).ticks(10).tickFormat((d) => d + "B");

    // Asse X in basso
    g.append("g")
      .attr("id", "x-axis")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis);

    // Asse Y a sinistra
    g.append("g").attr("id", "y-axis").attr("class", "axis").call(yAxis);

    // Label verticale asse Y
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .attr("class", "y-label")
      .text("Gross Domestic Product, billions USD");

    // Larghezza calcolata in base al numero di record
    const barWidth = innerWidth / dataset.length;

    // --------------------------------------------------------
    // DISEGNO BARRE
    // --------------------------------------------------------
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
      // Hover: mostrare tooltip
      .on("mouseover", function (event, d) {
        const [dateStr, gdp] = d;
        const date = new Date(dateStr);
        // Calcola trimestre a partire dal mese (0-based)
        const quarter = "Q" + (Math.floor(date.getMonth() / 3) + 1);

        tooltip
          .style("opacity", 1)
          .attr("data-date", dateStr)
          .html(
            `<strong>${date.getFullYear()} ${quarter}</strong>` +
            `$${gdp.toLocaleString("en-US")} Billion`
          );
      })
      // Mouse move: riposizionare tooltip in base al mouse ma dentro al container
      .on("mousemove", function (event) {
        const container = document.getElementById("container");
        const box = container.getBoundingClientRect();
        const ttBox = tooltip.node().getBoundingClientRect();

        // Posizione base (destra del puntatore)
        let left = event.clientX - box.left + 15;
        // Sopra il puntatore
        let top = event.clientY - box.top - ttBox.height - 10;

        // Se non c’è spazio sopra, mettilo sotto
        if (top < 0) {
          top = event.clientY - box.top + 16;
        }

        // Limiti orizzontali per non uscire dal container
        const padding = 8;
        if (left < padding) left = padding;
        if (left + ttBox.width > box.width - padding) {
          left = box.width - ttBox.width - padding;
        }

        tooltip.style("left", left + "px").style("top", top + "px");
      })
      // Uscita: nascondi tooltip
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });
  });
});

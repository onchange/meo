function drawGauge(svgEl, score) {
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const cx = 100;
  const cy = 100;
  const r = 80;
  const strokeWidth = 16;

  function polarToCartesian(angle) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function arcPath(from, to) {
    const s = polarToCartesian(from);
    const e = polarToCartesian(to);
    const largeArc = to - from > Math.PI ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  let color;
  if (score >= 80) color = "#22c55e";
  else if (score >= 60) color = "#eab308";
  else color = "#ef4444";

  const ratio = Math.min(Math.max(score / 100, 0), 1);
  const valueAngle = startAngle + ratio * (endAngle - startAngle);

  svgEl.innerHTML = `
    <path d="${arcPath(startAngle, endAngle)}"
          fill="none" stroke="#334155" stroke-width="${strokeWidth}" stroke-linecap="round"/>
    <path d="${arcPath(startAngle, valueAngle)}"
          fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
  `;
}

function renderDensityChart(canvasId, data) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.values,
          backgroundColor: ["#f43f5e", "#64748b", "#475569"],
          borderRadius: 6,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw} 件`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "#334155" },
          ticks: { color: "#94a3b8" },
        },
        y: {
          grid: { display: false },
          ticks: { color: "#f1f5f9", font: { size: 13 } },
        },
      },
    },
  });
}

function renderAgeChart(canvasId, data) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.values,
          backgroundColor: ["#38bdf8", "#f43f5e", "#94a3b8"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: "#f1f5f9",
            font: { size: 12 },
            padding: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw}%`,
          },
        },
      },
    },
  });
}

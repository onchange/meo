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
  if (score >= 80) color = "#16a34a";
  else if (score >= 60) color = "#ca8a04";
  else color = "#94a3b8";

  const ratio = Math.min(Math.max(score / 100, 0), 1);
  const valueAngle = startAngle + ratio * (endAngle - startAngle);

  svgEl.innerHTML = `
    <path d="${arcPath(startAngle, endAngle)}"
          fill="none" stroke="#e2e8f0" stroke-width="${strokeWidth}" stroke-linecap="round"/>
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
          backgroundColor: ["#2563eb", "#94a3b8", "#cbd5e1"],
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
          grid: { color: "#e2e8f0" },
          ticks: { color: "#64748b" },
        },
        y: {
          grid: { display: false },
          ticks: { color: "#1e293b", font: { size: 13 } },
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
          backgroundColor: ["#3b82f6", "#f59e0b", "#94a3b8"],
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
            color: "#334155",
            font: { size: 14, weight: "bold" },
            padding: 14,
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

document.addEventListener("DOMContentLoaded", () => {
  const analyticsContainer = document.getElementById("topUrlsBody");
  const totalUrlsElement = document.getElementById("totalUrls");
  const totalClicksElement = document.getElementById("totalClicks");
  const uniqueVisitorsElement = document.getElementById("uniqueVisitors");
  const timeFilters = document.querySelectorAll(".time-filter");
  let analyticsData = [];
  let currentDaysFilter = 7;

  // Initialize WebSocket connection
  const ws = new WebSocket("ws://localhost:8080");
  ws.onopen = () => {
    console.log("WebSocket connected");
  };
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "clickUpdate" && data.url) {
        console.log("Received click update:", data.url);
        const index = analyticsData.findIndex((u) => u.id === data.url.id);
        if (index !== -1) {
          analyticsData[index] = {
            ...analyticsData[index],
            clicks: data.url.clicks,
          };
          updateClickCount(data.url.id, data.url.clicks);
          updateSummaryCards();
        }
      }
    } catch (err) {
      console.error("WebSocket message error:", err);
    }
  };
  ws.onclose = () => {
    console.log("WebSocket disconnected");
  };

  async function loadAnalytics() {
    try {
      const response = await fetch("/api/analytics");
      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status}, ${response.statusText}`
        );
      }
      analyticsData = await response.json();
      console.log("Loaded analytics data:", analyticsData);
      renderAnalytics();
      updateSummaryCards();
      initCharts();
    } catch (err) {
      console.error("Failed to load analytics:", err.message, err.stack);
      showError(`Failed to load analytics data: ${err.message}`);
    }
  }

  function filterDataByDays(data, days) {
    if (days === 365) return data;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data.filter((url) => new Date(url.created_at) >= cutoff);
  }

  function renderAnalytics() {
    const filteredData = filterDataByDays(analyticsData, currentDaysFilter);
    const html = filteredData
      .map(
        (data) => `
      <tr data-id="${data.id}">
        <td data-label="Short URL"><a href="/${
          data.short_code
        }" target="_blank">${window.location.host}/${data.short_code}</a></td>
        <td data-label="Original URL" class="truncate"><a href="${
          data.original_url
        }" target="_blank" title="${data.original_url}">${
          data.original_url
        }</a></td>
        <td data-label="Clicks" class="clicks" data-id="${data.id}">${
          data.clicks || 0
        }</td>
      </tr>
    `
      )
      .join("");
    analyticsContainer.innerHTML =
      html ||
      '<tr><td colspan="3" class="url-empty"><i class="fas fa-chart-bar"></i><p>No analytics data found</p></td></tr>';
  }

  function updateClickCount(id, clicks) {
    const clickElement = document.querySelector(`.clicks[data-id="${id}"]`);
    if (clickElement) {
      clickElement.textContent = clicks;
      console.log(`Updated clicks for URL ${id}: ${clicks}`);
    } else {
      console.warn(`Click element not found for URL ${id}`);
    }
  }

  function updateSummaryCards() {
    const filteredData = filterDataByDays(analyticsData, currentDaysFilter);
    totalUrlsElement.textContent = filteredData.length;
    totalClicksElement.textContent = filteredData.reduce(
      (sum, url) => sum + (url.clicks || 0),
      0
    );
    uniqueVisitorsElement.textContent =
      filteredData.length > 0
        ? Math.floor(
            filteredData.reduce((sum, url) => sum + (url.clicks || 0), 0) / 2
          )
        : 0;
  }

  function initCharts() {
    const filteredData = filterDataByDays(analyticsData, currentDaysFilter);
    const clicksData = filteredData.reduce((acc, url) => {
      const date = new Date(url.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + (url.clicks || 0);
      return acc;
    }, {});

    const labels = Object.keys(clicksData);
    const data = Object.values(clicksData);

    const clicksChart = new Chart(document.getElementById("clicksChart"), {
      type: "line",
      data: {
        labels: labels.length ? labels : ["No Data"],
        datasets: [
          {
            label: "Clicks Over Time",
            data: data.length ? data : [0],
            borderColor: "#4361ee",
            backgroundColor: "rgba(67, 97, 238, 0.2)",
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
    const sourcesChart = new Chart(document.getElementById("sourcesChart"), {
      type: "pie",
      data: {
        labels: ["Direct", "Social", "Referral"],
        datasets: [
          {
            label: "Traffic Sources",
            data: [60, 25, 15],
            backgroundColor: ["#4361ee", "#4cc9f0", "#f8961e"],
          },
        ],
      },
      options: {
        responsive: true,
      },
    });
  }

  function showError(message) {
    const errorEl = document.createElement("div");
    errorEl.className = "error-message";
    errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    analyticsContainer.parentElement.insertAdjacentElement(
      "beforebegin",
      errorEl
    );
    setTimeout(() => {
      errorEl.remove();
    }, 5000);
  }

  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentDaysFilter = parseInt(button.dataset.days);
      renderAnalytics();
      updateSummaryCards();
      initCharts();
    });
  });

  loadAnalytics();
});

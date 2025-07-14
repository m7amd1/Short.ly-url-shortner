document.addEventListener("DOMContentLoaded", () => {
  const urlForm = document.getElementById("urlForm");
  const originalUrlInput = document.getElementById("originalUrl");
  const resultDiv = document.getElementById("result");
  const urlsContainer = document.getElementById("urlsContainer");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  let urls = [];

  // Initialize WebSocket connection
  const ws = new WebSocket("ws://localhost:8080");
  ws.onopen = () => {
    console.log("WebSocket connected");
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "clickUpdate" && data.url) {
      const index = urls.findIndex((u) => u.id === data.url.id);
      if (index !== -1) {
        urls[index] = { ...urls[index], clicks: data.url.clicks };
        updateClickCount(data.url.id, data.url.clicks);
      }
    }
  };
  ws.onclose = () => {
    console.log("WebSocket disconnected");
  };

  urlForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const originalUrl = originalUrlInput.value.trim();
    const label = document.getElementById("urlLabel").value.trim();

    if (!originalUrl) return;

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalUrl,
          label,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showResult(data);
        loadUrls();
      } else {
        showError(data.error || "Failed to shorten URL");
      }
    } catch (err) {
      showError("Failed to connect to server");
      console.error("Error:", err);
    }
  });

  function showResult(data) {
    resultDiv.innerHTML = `
      <div class="result-box card">
        <div class="result-header">
          ${data.label ? `<h3>${data.label}</h3>` : ""}
          <a href="${
            data.shortUrl
          }" target="_blank" id="shortUrl" class="url-short">${
      data.shortUrl
    }</a>
        </div>
        <div class="result-actions">
          <button id="copyBtn" class="btn btn-outline"><i class="far fa-copy"></i> Copy</button>
          <button id="newBtn" class="btn btn-outline"><i class="fas fa-plus"></i> Generate New Url</button>
        </div>
      </div>
    `;
    resultDiv.classList.remove("hidden");

    document.getElementById("copyBtn").addEventListener("click", () => {
      navigator.clipboard.writeText(data.shortUrl).then(() => {
        const copyBtn = document.getElementById("copyBtn");
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
        }, 2000);
      });
    });

    document.getElementById("newBtn").addEventListener("click", () => {
      resultDiv.classList.add("hidden");
      originalUrlInput.focus();
      urlForm.reset();
    });
  }

  function showError(message) {
    const errorEl = document.createElement("div");
    errorEl.className = "error-message";
    errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    const formHeader = urlForm.querySelector("h2");
    formHeader.insertAdjacentElement("afterend", errorEl);

    setTimeout(() => {
      errorEl.remove();
    }, 5000);
  }

  async function loadUrls() {
    try {
      const response = await fetch("/api/urls");
      urls = await response.json();
      renderUrls();
    } catch (err) {
      console.error("Failed to load URLs:", err);
      showError("Failed to load URLs");
    }
  }

  function renderUrls() {
    const searchTerm = searchInput.value.toLowerCase();
    const sortBy = sortSelect.value;

    let filteredUrls = urls.filter(
      (url) =>
        (url.original_url &&
          url.original_url.toLowerCase().includes(searchTerm)) ||
        (url.short_code && url.short_code.toLowerCase().includes(searchTerm)) ||
        (url.label && url.label.toLowerCase().includes(searchTerm))
    );

    switch (sortBy) {
      case "oldest":
        filteredUrls.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case "most":
        filteredUrls.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        break;
      default:
        filteredUrls.sort(
          (a, b) => new Date(b.created_at) - new Date(b.created_at)
        );
    }

    const header = `
      <div class="url-header card">
        <div class="url-content">
          <span class="header-label">Label</span>
          <span class="header-original">Original URL</span>
          <span class="header-short">Shortened URL</span>
        </div>
        <div class="url-stats">
          <span class="header-date">Time</span>
          <span class="header-clicks">Clicks</span>
        </div>
        <div class="url-actions">
          <span class="header-actions">Actions</span>
        </div>
      </div>
    `;

    const html = filteredUrls
      .map(
        (url) => `
      <div class="url-item card" data-id="${url.id}">
        <div class="url-content">
          ${
            url.label
              ? `<span class="url-label">${url.label}</span>`
              : '<span class="url-label"> </span>'
          }
          <a href="${
            url.original_url
          }" class="url-original truncate" target="_blank" title="${
          url.original_url
        }">${url.original_url}</a>
          <a href="/${
            url.short_code
          }" class="url-short truncate" target="_blank" title="${
          window.location.host
        }/${url.short_code}">${window.location.host}/${url.short_code}</a>
        </div>
        <div class="url-stats">
          <span class="url-date">${new Date(
            url.created_at
          ).toLocaleString()}</span>
          <span class="url-clicks" data-id="${
            url.id
          }"><i class="fas fa-mouse-pointer"></i> ${
          url.clicks || 0
        } clicks</span>
        </div>
        <div class="url-actions">
          <button class="action-btn edit-btn" data-id="${url.id}" title="Edit">
            <i class="far fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" data-id="${
            url.id
          }" title="Delete">
            <i class="far fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    urlsContainer.innerHTML =
      filteredUrls.length > 0
        ? header + html
        : '<div class="url-empty"><i class="fas fa-link"></i><p>No URLs found</p></div>';

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => showDeleteConfirm(btn.dataset.id));
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => editUrl(btn.dataset.id));
    });
  }

  function updateClickCount(id, clicks) {
    const clickElement = document.querySelector(`.url-clicks[data-id="${id}"]`);
    if (clickElement) {
      clickElement.innerHTML = `<i class="fas fa-mouse-pointer"></i> ${clicks} clicks`;
    }
  }

  async function showDeleteConfirm(id) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content card">
        <h3>Confirm Deletion</h3>
        <p>Are you sure you want to delete this URL?</p>
        <div class="form-actions">
          <button class="btn btn-outline btn-cancel">Cancel</button>
          <button class="btn btn-danger btn-confirm">Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".btn-cancel").addEventListener("click", () => {
      modal.remove();
    });

    modal.querySelector(".btn-confirm").addEventListener("click", async () => {
      try {
        const response = await fetch(`/api/urls/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          loadUrls();
          modal.remove();
        } else {
          const data = await response.json();
          showError(data.error || "Failed to delete URL");
          modal.remove();
        }
      } catch (err) {
        showError("Failed to connect to server");
        console.error("Error:", err);
        modal.remove();
      }
    });
  }

  async function editUrl(id) {
    const url = urls.find((u) => u.id == id);
    if (!url) return;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content card">
        <h3>Edit URL</h3>
        <form id="editForm">
          <div class="form-group">
            <label for="editLabel">Label</label>
            <input type="text" id="editLabel" value="${url.label || ""}">
          </div>
          <div class="form-group">
            <label for="editOriginalUrl">Destination URL</label>
            <input type="url" id="editOriginalUrl" value="${
              url.original_url
            }" required>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline btn-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary btn-save">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document
      .getElementById("editForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const label = document.getElementById("editLabel").value.trim();
        const originalUrl = document
          .getElementById("editOriginalUrl")
          .value.trim();

        try {
          const response = await fetch(`/api/urls/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ label, originalUrl }),
          });

          if (response.ok) {
            loadUrls();
            modal.remove();
          } else {
            const data = await response.json();
            showError(data.error || "Failed to update URL");
          }
        } catch (err) {
          showError("Failed to connect to server");
          console.error("Error:", err);
        }
      });

    modal.querySelector(".btn-cancel").addEventListener("click", () => {
      modal.remove();
    });
  }

  searchInput.addEventListener("input", renderUrls);
  sortSelect.addEventListener("change", renderUrls);

  loadUrls();
});

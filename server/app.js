const express = require("express");
const bodyParser = require("body-parser");
const urlService = require("./services/urlService");
const analyticsService = require("./services/analyticsService");
const { WebSocketServer } = require("ws");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));

// Initialize WebSocket server
const wss = new WebSocketServer({ port: 8080 });

// Store connected clients
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => {
    clients.delete(ws);
  });
});

// Shorten URL
app.post("/api/shorten", async (req, res) => {
  const { originalUrl, label } = req.body;
  try {
    if (!originalUrl) {
      return res.status(400).json({ error: "Original URL is required" });
    }
    const shortUrl = await urlService.createShortUrl(originalUrl, label);
    res.json(shortUrl);
  } catch (err) {
    console.error("Error shortening URL:", err);
    res.status(500).json({ error: "Failed to shorten URL" });
  }
});

// Redirect URL
app.get("/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const url = await urlService.getOriginalUrl(code);
    if (!url) {
      return res
        .status(404)
        .sendFile(path.join(__dirname, "../public/404.html"));
    }
    await urlService.incrementClicks(code);
    // Fetch updated URL data
    const updatedUrl = await urlService.getUrlByCode(code);
    // Broadcast updated click count to all clients
    clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(
          JSON.stringify({
            type: "clickUpdate",
            url: updatedUrl,
          })
        );
      }
    });
    res.redirect(url.original_url);
  } catch (err) {
    console.error("Error redirecting:", err);
    res.status(500).sendFile(path.join(__dirname, "../public/500.html"));
  }
});

// Get all URLs
app.get("/api/urls", async (req, res) => {
  try {
    const urls = await urlService.getAllUrls();
    res.json(urls);
  } catch (err) {
    console.error("Error fetching URLs:", err);
    res.status(500).json({ error: "Failed to fetch URLs" });
  }
});

// Delete URL
app.delete("/api/urls/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await urlService.deleteUrl(id);
    res.json({ message: "URL deleted successfully" });
  } catch (err) {
    console.error("Error deleting URL:", err);
    res.status(500).json({ error: "Failed to delete URL" });
  }
});

// Update URL
app.put("/api/urls/:id", async (req, res) => {
  const { id } = req.params;
  const { label, originalUrl } = req.body;
  try {
    await urlService.updateUrl(id, label, originalUrl);
    res.json({ message: "URL updated successfully" });
  } catch (err) {
    console.error("Error updating URL:", err);
    res.status(500).json({ error: "Failed to update URL" });
  }
});

// Get analytics data
app.get("/api/analytics", async (req, res) => {
  try {
    const data = await analyticsService.getAnalyticsData();
    res.json(data);
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

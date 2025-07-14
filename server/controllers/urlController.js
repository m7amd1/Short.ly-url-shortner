const urlService = require("../services/urlService");

const shortenUrl = async (req, res) => {
  try {
    const { originalUrl, label } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    const { id, shortCode } = await urlService.createShortUrl({
      originalUrl,
      label,
    });
    const shortUrl = `${req.protocol}://${req.get("host")}/${shortCode}`;

    res.status(201).json({
      id,
      originalUrl,
      shortUrl,
      shortCode,
      label,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const redirect = async (req, res) => {
  try {
    const { code } = req.params;
    const urlData = await urlService.getOriginalUrl(code);

    if (!urlData) {
      return res.status(404).send("URL not found");
    }

    await urlService.recordClick(urlData.id, {
      referrer: req.get("Referer"),
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    res.redirect(urlData.original_url);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

const getUrls = async (req, res) => {
  try {
    const urls = await urlService.getAllUrls();
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  shortenUrl,
  redirect,
  getUrls,
};

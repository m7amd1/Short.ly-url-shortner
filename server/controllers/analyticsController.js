const analyticsService = require("../services/analyticsService");

const getAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    if (days < 1 || days > 365) {
      return res.status(400).json({ error: "Days must be between 1 and 365" });
    }

    const [summary, trends, topUrls, referrers] = await Promise.all([
      analyticsService.getAnalyticsSummary(),
      analyticsService.getClickTrends(days),
      analyticsService.getTopUrls(),
      analyticsService.getReferrerData(),
    ]);

    res.json({
      summary,
      trends,
      topUrls,
      referrers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAnalytics,
};

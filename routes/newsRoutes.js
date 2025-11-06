const express = require("express");
const Parser = require("rss-parser");
const NodeCache = require("node-cache");

const router = express.Router();
const parser = new Parser();
const cache = new NodeCache({ stdTTL: 600 }); // cache 10 min

// ✅ Define FEEDS array BEFORE using it
const FEEDS = [
    "https://economictimes.indiatimes.com/rssfeeds/1977021501.cms", // ET Markets
    "https://www.moneycontrol.com/rss/latestnews.xml", // Moneycontrol
    "https://www.livemint.com/rss/markets" // LiveMint
];

router.get("/finance-news", async (req, res) => {
    try {
        // ✅ Check cache first
        const cached = cache.get("finance-news");
        if (cached) {
            return res.json(cached);
        }

        // ✅ Fetch from all RSS feeds
        const allFeeds = await Promise.all(FEEDS.map(url => parser.parseURL(url)));

        const articles = allFeeds.flatMap(feed =>
            feed.items.map(item => ({
                title: item.title,
                link: item.link,
                date: item.pubDate,
                source: feed.title,
                description: item.contentSnippet || item.content || "",
            }))
        );

        // ✅ Sort by latest date
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));

        const latestArticles = articles.slice(0, 15);

        // ✅ Store in cache
        cache.set("finance-news", latestArticles);

        res.json(latestArticles);
    } catch (error) {
        console.error("Error fetching RSS feeds:", error);
        res.status(500).json({ message: "Failed to fetch RSS feeds" });
    }
});

module.exports = router;

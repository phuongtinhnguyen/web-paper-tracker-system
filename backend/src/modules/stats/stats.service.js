const statsRepository = require("./stats.repository");

function mapTopicTrend(topic) {
  return {
    id: topic.id,
    name: topic.name,
    trending: Number(topic.trending || 0),
    paper_count: Number(topic.paper_count || 0),
    recent_paper_count: Number(topic.recent_paper_count || 0),
  };
}

async function getTopicTrends(query) {
  const topics = await statsRepository.getTopicTrends(query.limit);

  return topics.map(mapTopicTrend);
}

module.exports = {
  getTopicTrends,
};

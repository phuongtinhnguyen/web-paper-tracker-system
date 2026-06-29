const AppError = require("../../utils/appError");
const historyRepository = require("./history.repository");

function normalizeAuthors(authors) {
  if (!authors) {
    return [];
  }

  if (Array.isArray(authors)) {
    return authors;
  }

  return authors
    .split(",")
    .map((author) => author.trim())
    .filter(Boolean);
}

function mapHistoryPaper(paper) {
  return {
    id: paper.id,
    arxiv_id: paper.arxiv_id,
    title: paper.title,
    abstract: paper.abstract,
    summary: paper.summary,
    authors: normalizeAuthors(paper.authors),
    published_date: paper.published_date,
    pdf_url: paper.pdf_url,
    avg_rating: paper.avg_rating ? Number(paper.avg_rating) : 0,
    topic_id: paper.topic_id,
    read_at: paper.read_at,
  };
}

async function getHistory(userId, query) {
  const { page, limit, search } = query;
  const { papers, total } = await historyRepository.getHistory({
    userId,
    page,
    limit,
    search,
  });

  return {
    papers: papers.map(mapHistoryPaper),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

async function removeHistoryItem(userId, paperId) {
  const removedItem = await historyRepository.removeHistoryItem(userId, paperId);

  if (!removedItem) {
    throw new AppError("Reading history item not found", 404);
  }

  return {
    paper_id: removedItem.paper_id,
    is_read: removedItem.is_read,
  };
}

async function clearHistory(userId) {
  const removed_count = await historyRepository.clearHistory(userId);

  return {
    removed_count,
  };
}

module.exports = {
  getHistory,
  removeHistoryItem,
  clearHistory,
};

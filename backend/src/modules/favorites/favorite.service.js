const AppError = require("../../utils/appError");
const favoriteRepository = require("./favorite.repository");

function normalizeAuthors(authors) {
  if (!authors) return [];

  return authors
    .split(",")
    .map((author) => author.trim())
    .filter(Boolean);
}

function mapFavoritePaper(paper) {
  return {
    id: paper.id,
    arxiv_id: paper.arxiv_id,
    title: paper.title,
    abstract: paper.abstract,
    summary: paper.summary,
    authors: normalizeAuthors(paper.authors),
    published_date: paper.published_date,
    pdf_url: paper.pdf_url,
    topic_id: paper.topic_id,
    favorited_at: paper.favorited_at,
  };
}

async function addFavorite(userId, paperId) {
  const paper = await favoriteRepository.findPaperById(paperId);

  if (!paper) {
    throw new AppError("Paper not found", 404);
  }

  await favoriteRepository.addFavorite(userId, paperId);

  return {
    paper_id: paperId,
    is_favorite: true,
  };
}

async function removeFavorite(userId, paperId) {
  const paper = await favoriteRepository.findPaperById(paperId);

  if (!paper) {
    throw new AppError("Paper not found", 404);
  }

  await favoriteRepository.removeFavorite(userId, paperId);

  return {
    paper_id: paperId,
    is_favorite: false,
  };
}

async function getFavorites(userId, query) {
  const { page, limit } = query;
  const { papers, total } = await favoriteRepository.getFavorites({
    userId,
    page,
    limit,
  });

  return {
    papers: papers.map(mapFavoritePaper),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
};

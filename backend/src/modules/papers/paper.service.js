const paperRepository = require("./paper.repository");
const AppError = require("../../utils/appError");

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

function mapPaper(paper) {
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
  };
}

async function getPapers(query) {
  const { page, limit } = query;
  const { papers, total } = await paperRepository.getPapers(query);

  return {
    papers: papers.map(mapPaper),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

async function getPaperById(id) {
  const paper = await paperRepository.getPaperById(id);

  if (!paper) {
    throw new AppError("Paper not found", 404);
  }

  return mapPaper(paper);
}

async function searchPapers(query) {
  const { page, limit } = query;
  const { papers, total } = await paperRepository.searchPapers(query);

  return {
    papers: papers.map(mapPaper),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}


module.exports = {
  getPapers,
  getPaperById,
  searchPapers,
};

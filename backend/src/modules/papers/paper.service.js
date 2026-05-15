const paperRepository = require("./paper.repository");

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

module.exports = {
  getPapers,
};

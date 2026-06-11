const paperRepository = require("./paper.repository");
const AppError = require("../../utils/appError");
const axios = require("axios");
const env = require("../../config/env");

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
    created_at: paper.created_at,
    pdf_url: paper.pdf_url,
    avg_rating: paper.avg_rating ? Number(paper.avg_rating) : 0,
    topic_id: paper.topic_id,
    is_read: Boolean(paper.is_read),
    is_new: Boolean(paper.is_new),
  };
}


/*
Example return:
{
  papers: [
    {
      id: 1,
      arxiv_id: "2605.10938v1",
      title: "ELF: Embedded Language...",
      abstract: "Diffusion and flow-based models...",
      summary: "This paper introduces an embedded language framework...",
      authors: "Keya Hu, Lintao Qiu, Yi...",
      published_date: "2026-05-11T17:59:29.000Z",
      pdf_url: "http://arxiv.org/abs/2605.10938v1",
      avg_rating: 4.5,
      created_at: "2026-05-12T18:12:10.000Z",
      topic_id: 1,
      is_favorite: true,
      is_read: false
    },
    {
      id: 2,
      arxiv_id: "2605.10934v1",
      title: "Variational Inference...",
      abstract: "Modelling extreme events...",
      summary: null,
      authors: "Yaman Kindap, Manfred...",
      published_date: "2026-05-11T17:58:45.000Z",
      pdf_url: "http://arxiv.org/abs/2605.10934v1",
      avg_rating: null,
      created_at: "2026-05-12T18:12:10.000Z",
      topic_id: 1,
      is_favorite: false,
      is_read: true
    }
  ],
  pagination: {
    page: 1,
    limit: 2,
    total: 10,
    total_pages: 5
  }
}
*/
async function getPapers(query, userId = null) {
  const { page, limit } = query;
  const { papers, total } = await paperRepository.getPapers({
    ...query,
    userId,
  });

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

async function getPaperById(id, userId = null) {
  const paper = await paperRepository.getPaperById(id);

  if (!paper) {
    throw new AppError("Paper not found", 404);
  }

  if (userId) {
    await paperRepository.markPaperAsRead(userId, id);
  }

  return mapPaper(paper);
}

async function searchPapers(query, userId = null) {
  const { page, limit } = query;
  const { papers, total } = await paperRepository.searchPapers({
    ...query,
    userId,
  });

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

async function getRelatedPapers(id, query) {
  const { limit } = query;
  const paper = await paperRepository.getPaperById(id);

  if (!paper) {
    throw new AppError("Paper not found", 404);
  }

  const relatedFromTable = await paperRepository.getRelatedPapersFromTable(
    id,
    limit
  );
  let relatedPapers = relatedFromTable;
  let source = "related_papers";

  if (relatedPapers.length < limit && paper.topic_id) {
    const excludedIds = [
      Number(id),
      ...relatedPapers.map((relatedPaper) => relatedPaper.id),
    ];
    const sameTopicPapers = await paperRepository.getRelatedPapersByTopic(
      paper.topic_id,
      excludedIds,
      limit - relatedPapers.length
    );

    relatedPapers = [...relatedPapers, ...sameTopicPapers];

    if (relatedFromTable.length === 0) {
      source = "same_topic";
    } else if (sameTopicPapers.length > 0) {
      source = "related_papers_with_same_topic_fallback";
    }
  } else if (relatedPapers.length === 0) {
    source = "none";
  }

  return {
    paper_id: Number(id),
    source,
    related_papers: relatedPapers.map(mapPaper),
  };
}

async function getMatchingPapers(id, query) {
  const { limit } = query;
  const paper = await paperRepository.getPaperById(id);

  if (!paper) {
    throw new AppError("Paper not found", 404);
  }

  const matches = await paperRepository.getMatchingPapers(id, limit);

  return {
    paper_id: Number(id),
    matches: matches.map((match) => ({
      matching_paper_id: match.id,
      similarity_score: match.similarity_score
        ? Number(match.similarity_score)
        : 0,
      match_type: match.match_type,
      created_at: match.match_created_at,
      paper: mapPaper(match),
    })),
  };
}

async function summarizePaper(id) {
  const paper = await paperRepository.getPaperById(id);

  if (!paper) {
    throw new AppError("Paper not found", 404);
  }

  if (paper.summary) {
    return {
      paper_id: paper.id,
      summary: paper.summary,
      source: "database",
    };
  }

  if (!paper.abstract) {
    throw new AppError("Paper abstract is empty", 400);
  }

  const aiResponse = await axios.post(`${env.aiServiceUrl}/summarize`, {
    abstract: paper.abstract,
  });

  const summary = aiResponse.data?.data?.summary;

  if (!summary) {
    throw new AppError("AI service did not return summary", 502);
  }

  await paperRepository.updatePaperSummary(id, summary);

  return {
    paper_id: paper.id,
    summary,
    source: "ai_service",
  };
}

async function submitPaperRating(userId, paperId, rating) {
  const paper = await paperRepository.getPaperById(paperId);

  if (!paper) {
    throw new AppError("Paper not found", 404);
  }

  const result = await paperRepository.upsertPaperRating(
    userId,
    paperId,
    rating
  );

  return {
    paper_id: Number(paperId),
    rating: result.rating,
    avg_rating: result.avg_rating,
    rating_count: result.rating_count,
  };
}

async function getMyPaperRating(userId, paperId) {
  const paper = await paperRepository.getPaperById(paperId);

  if (!paper) {
    throw new AppError("Paper not found", 404);
  }

  const result = await paperRepository.getUserPaperRating(userId, paperId);

  return {
    paper_id: Number(paperId),
    rating: result?.rating ?? null,
    avg_rating: result?.avg_rating ? Number(result.avg_rating) : 0,
    rating_count: result?.rating_count || 0,
  };
}


module.exports = {
  getPapers,
  getPaperById,
  searchPapers,
  getRelatedPapers,
  getMatchingPapers,
  summarizePaper,
  submitPaperRating,
  getMyPaperRating,
};

export const PAPER_DATA_UPDATED_EVENT = "paper-data-updated";

export function notifyPaperDataUpdated(detail = {}) {
  window.dispatchEvent(
    new CustomEvent(PAPER_DATA_UPDATED_EVENT, {
      detail,
    })
  );
}

export function subscribePaperDataUpdated(handler) {
  window.addEventListener(PAPER_DATA_UPDATED_EVENT, handler);

  return () => {
    window.removeEventListener(PAPER_DATA_UPDATED_EVENT, handler);
  };
}

export function getPaperUpdateTopicId(detail = {}) {
  const notification = detail.notification || detail;

  return (
    notification.topic_id ||
    notification.topic?.id ||
    notification.paper?.topic_id ||
    null
  );
}

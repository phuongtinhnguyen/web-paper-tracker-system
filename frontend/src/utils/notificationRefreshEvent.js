export const NOTIFICATIONS_UPDATED_EVENT = "notifications-updated";

export function notifyNotificationsUpdated(detail = {}) {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, {
      detail,
    })
  );
}

export function subscribeNotificationsUpdated(handler) {
  window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);

  return () => {
    window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);
  };
}

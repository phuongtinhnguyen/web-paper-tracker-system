/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getCrawlerStatus, runCrawler } from "../services/API";
import { notifyNotificationsUpdated } from "../utils/notificationRefreshEvent";
import { notifyPaperDataUpdated } from "../utils/paperRefreshEvent";

const CrawlerContext = createContext(null);

export function CrawlerProvider({ children }) {
  const [isCrawlerRunning, setIsCrawlerRunning] = useState(false);
  const [crawlerStatus, setCrawlerStatus] = useState({ is_running: false });
  const wasCrawlerRunningRef = useRef(false);

  const refreshCrawlerStatus = useCallback(async () => {
    try {
      const res = await getCrawlerStatus();
      const status = res.data?.data || { is_running: false };
      const isRunning = Boolean(status.is_running);
      const hasJustFinished = wasCrawlerRunningRef.current && !isRunning;

      setCrawlerStatus(status);
      setIsCrawlerRunning(isRunning);
      wasCrawlerRunningRef.current = isRunning;

      if (hasJustFinished) {
        notifyPaperDataUpdated({
          source: "manual_crawler_done",
          topic_id: status.topic_id || null,
        });
        notifyNotificationsUpdated({
          source: "manual_crawler_done",
          topic_id: status.topic_id || null,
        });
      }

      return status;
    } catch {
      setCrawlerStatus({ is_running: false });
      setIsCrawlerRunning(false);
      wasCrawlerRunningRef.current = false;
      return { is_running: false };
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshCrawlerStatus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshCrawlerStatus]);

  useEffect(() => {
    if (!isCrawlerRunning) return undefined;

    const interval = window.setInterval(() => {
      refreshCrawlerStatus();
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isCrawlerRunning, refreshCrawlerStatus]);

  useEffect(() => {
    if (isCrawlerRunning || !crawlerStatus.cooldown_until) return undefined;

    const interval = window.setInterval(() => {
      setCrawlerStatus((currentStatus) => {
        if (!currentStatus.cooldown_until) return currentStatus;

        const cooldownUntilMs = Date.parse(currentStatus.cooldown_until);

        if (Number.isNaN(cooldownUntilMs)) {
          return {
            ...currentStatus,
            cooldown_remaining_ms: 0,
            cooldown_until: null,
          };
        }

        const remainingMs = Math.max(0, cooldownUntilMs - Date.now());

        return {
          ...currentStatus,
          cooldown_remaining_ms: remainingMs,
          cooldown_until: remainingMs > 0 ? currentStatus.cooldown_until : null,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [crawlerStatus.cooldown_until, isCrawlerRunning]);

  const startCrawler = useCallback(
    async (payload = {}) => {
      setIsCrawlerRunning(true);
      setCrawlerStatus({
        is_running: true,
        scope: payload.topic_id ? "topic" : "latest",
        topic_id: payload.topic_id || null,
        max_results: payload.max_results || 5,
      });
      wasCrawlerRunningRef.current = true;

      try {
        const res = await runCrawler(payload);
        return res;
      } catch (error) {
        if (error.response?.status !== 409) {
          setIsCrawlerRunning(false);
          setCrawlerStatus({ is_running: false });
          wasCrawlerRunningRef.current = false;
        }

        throw error;
      } finally {
        refreshCrawlerStatus();
      }
    },
    [refreshCrawlerStatus]
  );

  const crawlerCooldownSeconds = Math.ceil(
    Number(crawlerStatus.cooldown_remaining_ms || 0) / 1000
  );

  return (
    <CrawlerContext.Provider
      value={{
        crawlerCooldownSeconds,
        crawlerStatus,
        isCrawlerRunning,
        refreshCrawlerStatus,
        startCrawler,
      }}
    >
      {children}
    </CrawlerContext.Provider>
  );
}

export function useCrawler() {
  const context = useContext(CrawlerContext);

  if (!context) {
    throw new Error("useCrawler must be used within CrawlerProvider");
  }

  return context;
}

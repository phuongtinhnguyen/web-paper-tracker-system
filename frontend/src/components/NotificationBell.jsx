import { useState, useEffect, useRef, useMemo } from "react";
import { Bell, Loader2 } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../services/API";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Lấy danh sách thông báo từ API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ page: 1, limit: 10 });
      const result = res.data ?? {};
      const list = result.data?.data || result.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setNotifications(list);
      } else {
        setNotifications([]);
      }
    } catch {
      // BE chưa có API notifications
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Đếm số thông báo chưa đọc dựa trên cột is_read từ backend
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.is_read === false).length,
    [notifications]
  );

  const handleToggle = () => {
    if (!isOpen) fetchNotifications();
    setIsOpen(!isOpen);
  };

  // Đánh dấu tất cả đã đọc qua API
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch {
      // Silent fail
    }
  };

  // Đánh dấu 1 thông báo đã đọc qua API
  const handleNotificationClick = async (notif) => {
    const notifId = notif.id || notif.notification_id;

    if (notif.is_read === false) {
      try {
        await markNotificationRead(notifId);
        setNotifications((prev) =>
          prev.map((n) =>
            (n.id === notifId || n.notification_id === notifId)
              ? { ...n, is_read: true }
              : n
          )
        );
      } catch {
        // Silent fail
      }
    }

    setIsOpen(false);
  };

  // Format ngày giờ
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMs / 3600000);
      const diffDay = Math.floor(diffMs / 86400000);

      if (diffMin < 1) return "Vừa xong";
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHour < 24) return `${diffHour} giờ trước`;
      if (diffDay < 7) return `${diffDay} ngày trước`;
      return d.toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
        title="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-100 shadow-2xl rounded-2xl z-[1000] animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-700 text-sm">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Danh sách thông báo */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-emerald-500" size={24} />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => {
                const unread = notif.is_read === false;
                return (
                  <button
                    key={notif.id || notif.notification_id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-emerald-50 transition-colors ${
                      unread ? "bg-blue-50/60" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          unread ? "bg-emerald-500" : "bg-transparent"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-700">
                            {notif.username || notif.user_name || "Hệ thống"}
                          </p>
                          <p className="text-[10px] text-gray-400 flex-shrink-0">
                            {formatDate(notif.created_at)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700 font-medium mt-0.5">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <Bell size={24} className="mb-2" />
                <p className="text-sm font-medium">Không có thông báo mới</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 text-center">
            <button
              onClick={fetchNotifications}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Làm mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
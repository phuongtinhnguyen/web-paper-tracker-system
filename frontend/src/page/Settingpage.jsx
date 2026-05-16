import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile, changePassword } from "../services/API";

function Settingpage({ isOpen, onClose }) {
  const navigate = useNavigate();

  // Hỗ trợ cả 2 mode: dùng như Modal (có isOpen/onClose) hoặc Page (route)
  const isModalMode = isOpen !== undefined;
  const isVisible = !isModalMode || isOpen;

  const [activeTab, setActiveTab] = useState("profile");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Xử lý đóng: modal mode → gọi onClose, page mode → navigate về dashboard
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/dashboard");
    }
  };

  // Tự động gọi API lấy thông tin tài khoản khi Modal/Page được mở lên
  useEffect(() => {
    if (isVisible) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const response = await getProfile();
          // Backend trả về { success, message, data: { user: { id, email, username } } }
          const userData = response.data?.data?.user || response.data;

          setUsername(userData.username || "");
          setEmail(userData.email || "");
        } catch (error) {
          console.error("Lỗi khi lấy thông tin tài khoản:", error);
          alert("Không thể tải thông tin tài khoản!");
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  // Xử lý cập nhật Username
  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await updateProfile(username);
      const updatedUser = response.data?.data?.user;

      if (updatedUser?.username) {
        localStorage.setItem("username", updatedUser.username);
        window.dispatchEvent(
          new CustomEvent("username-updated", {
            detail: { username: updatedUser.username },
          }),
        );
      }
      alert("Cập nhật thông tin tài khoản thành công!");
      if (onClose) onClose();
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
      alert(
        error.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại!",
      );
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đổi mật khẩu
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }
    try {
      setLoading(true);
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
      alert("Đổi mật khẩu thành công!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      handleClose();
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      alert(
        error.response?.data?.message ||
          "Đổi mật khẩu thất bại, vui lòng thử lại!",
      );
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div className="w-full max-w-md bg-green-20 rounded-xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-100">
        <h3 className="text-lg font-bold text-green-800">Cài đặt tài khoản</h3>
        <button
          onClick={handleClose}
          className="text-red-400 hover:text-red-600 text-2xl font-semibold"
        >
          &times;
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-3 text-center text-sm font-medium ${
            activeTab === "profile"
              ? "border-b-2 border-blue-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          Thông tin tài khoản
        </button>
        <button
          className={`flex-1 py-3 text-center text-sm font-medium ${
            activeTab === "password"
              ? "border-b-2 border-blue-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("password")}
        >
          Đổi mật khẩu
        </button>
      </div>

      {/* Nội dung Form */}
      <div className="p-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <span className="text-sm font-medium text-gray-600 animate-pulse">
              Đang xử lý...
            </span>
          </div>
        )}

        {activeTab === "profile" ? (
          <form onSubmit={handleUpdateUsername} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Email (Không thể sửa)
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
              >
                Đổi mật khẩu
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  // MODAL MODE: hiển thị với overlay backdrop
  if (isModalMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        {cardContent}
      </div>
    );
  }

  // PAGE MODE: render inline trong <main> của MainLayout (không có backdrop)
  return <div className="flex justify-center py-6">{cardContent}</div>;
}

export default Settingpage;

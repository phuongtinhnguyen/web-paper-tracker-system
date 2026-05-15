import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  const location = useLocation();

  if (!token) {
    // Chuyển hướng đến trang login, lưu lại vị trí hiện tại để quay lại sau khi login thành công
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
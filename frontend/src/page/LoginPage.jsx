import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api'; // Import hàm gọi API
import backgroundImg from '../assets/background.jpg';
import SuccessModal from '../components/SuccessModal';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      
      const response = await loginUser({
        email: email,
        password: password
      });

      // Nếu BE trả về thành công (thường là 200)
      if (response.status === 200) {
        // Lưu token hoặc thông tin user nếu cần
        const { access_token, username } = response.data;
        if (access_token) localStorage.setItem("token", access_token);
        localStorage.setItem("username", username || "User");

        setModalConfig({
          isOpen: true,
          title: "Thành công!",
          message: "Chào mừng bạn trở lại. Hệ thống đã sẵn sàng!",
          onConfirm: () => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            navigate("/dashboard");
          }
        });
      }
    } catch (error) {
      
      let errorMsg = "Email hoặc mật khẩu không chính xác.";
      
      if (error.response && error.response.data) {
        errorMsg = error.response.data.detail || errorMsg;
      } else if (!error.response) {
        errorMsg = "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.";
      }

      setModalConfig({
        isOpen: true,
        title: "Đăng nhập thất bại",
        message: errorMsg,
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      console.error("Login Error:", error);
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    
    setModalConfig({
      isOpen: true,
      title: "Đã gửi yêu cầu!",
      message: `Chúng tôi đã gửi hướng dẫn lấy lại mật khẩu vào email:\n${email}`,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setIsForgotPassword(false);
      }
    });
  };
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <div className="absolute inset-0 bg-black/20"></div> 

      <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/30 w-[450px] min-h-[650px]">
        {isForgotPassword ? (
          // --- GIAO DIỆN QUÊN MẬT KHẨU ---
          <div className="transition-all duration-500">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
              <p className="text-gray-600 mt-4 text-lg">Nhập email để nhận lại mật khẩu</p>
            </div>
            
            <form onSubmit={handleResetPassword} className="space-y-[30px]">
              <input
                type="email"
                required
                className="block mx-auto w-11/12 px-5 py-4 text-lg rounded-xl border border-gray-300 outline-none bg-white/80 focus:ring-2 focus:ring-blue-500"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="block mx-auto w-11/12 bg-green-600 text-white text-[20px] font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 transition active:scale-95">
                Gửi mã xác nhận
              </button>
              <div className="text-center mt-6">
                <button type="button" onClick={() => setIsForgotPassword(false)} className="text-indigo-600 font-semibold hover:underline text-lg">
                  Quay lại Đăng nhập
                </button>
              </div>
            </form>
          </div>
        ) : (
         
          <div className="transition-all duration-500">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900">Chào mừng trở lại</h1>
              <p className="text-gray-600 mt-4 text-lg">Vui lòng đăng nhập tài khoản</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-[25px]">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 ml-4">Email</label>
                <input
                  type="email"
                  required
                  className="block mx-auto w-11/12 px-5 py-4 text-lg rounded-xl border border-gray-300 outline-none bg-white/80 focus:ring-2 focus:ring-green-500"
                  placeholder="Nhập email của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <div className="flex justify-between px-4 mb-2">
                  <label className="text-gray-700 font-semibold">Mật khẩu</label>
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text-indigo-600 hover:underline">Quên mật khẩu?</button>
                </div>
                <input
                  type="password"
                  required
                  className="block mx-auto w-11/12 px-5 py-4 text-lg rounded-xl border border-gray-300 outline-none bg-white/80 focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="block mx-auto w-11/12 bg-green-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-green-700 transition active:scale-95 shadow-lg">
                Đăng nhập ngay
              </button>
            </form>
            <div className="mt-12 text-center text-gray-600">
              Bạn mới đến đây? <Link to="/dang-ky" className="font-semibold text-green-600 hover:underline">Tạo tài khoản</Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal thông báo kết quả từ API */}
      <SuccessModal 
          isOpen={modalConfig.isOpen} 
          onClose={modalConfig.onConfirm} 
          message={modalConfig.message}
      />
    </div>
  );
}
export default LoginPage;
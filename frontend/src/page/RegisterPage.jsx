import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api'; // Sử dụng hàm từ file api.js
import backgroundImg from '../assets/background.jpg';
import SuccessModal from '../components/SuccessModal';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage(''); 

    // Kiểm tra logic mật khẩu tại Frontend
    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      
      const response = await registerUser({
        username: username, 
        email: email,
        password: password
      });

      // Kiểm tra phản hồi từ Backend
      if (response.status === 200 || response.status === 201) {
        console.log("Đăng ký thành công:", response.data);
        localStorage.setItem("username", username); 
        setShowModal(true);
      }
    } catch (error) {
      // Xử lý lỗi chi tiết từ Axios
      if (error.response) {
        
        const message = error.response.data.detail || "Đăng ký thất bại.";
        setErrorMessage(message);
      } else if (error.request) {
        
        setErrorMessage("Không thể kết nối đến máy chủ. Hãy kiểm tra Backend.");
      } else {
        setErrorMessage("Đã xảy ra lỗi không xác định.");
      }
      console.error("Axios Error:", error);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <div className="absolute inset-0 bg-black/10"></div> 

      <div 
        className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20"
        style={{ width: '450px', minHeight: '720px' }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Tạo tài khoản</h1>
          <p className="text-[20px] text-gray-600 mt-3 italic">Hệ thống Paper Tracker</p>
          
          {/* Hiển thị lỗi nếu có */}
          {errorMessage && (
            <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm font-medium animate-pulse">
              {errorMessage}
            </div>
          )}
        </div>

        <form onSubmit={handleRegister} className="space-y-[15px]">
          <div>
            <label className="block text-[18px] font-semibold text-gray-700 ml-4 mb-1">Tên người dùng</label>
            <input
              type="text"
              required
              className="block mx-auto w-11/12 px-5 py-3 text-lg rounded-xl border border-gray-300 outline-none bg-white/50 focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="Nhập username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 ml-4 mb-1">Email</label>
            <input
              type="email"
              required
              className="block mx-auto w-11/12 px-5 py-3 text-lg rounded-xl border border-gray-300 outline-none bg-white/50 focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 ml-4 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              className="block mx-auto w-11/12 px-5 py-3 text-lg rounded-xl border border-gray-300 outline-none bg-white/50 focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 ml-4 mb-1">Xác nhận mật khẩu</label>
            <input
              type="password"
              required
              className="block mx-auto w-11/12 px-5 py-3 text-lg rounded-xl border border-gray-300 outline-none bg-white/50 focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            className="block mt-6 mx-auto w-11/12 bg-green-600 hover:bg-green-700 text-white text-[20px] font-bold py-4 rounded-xl transition duration-300 shadow-lg active:scale-95"
          >
            Đăng ký ngay
          </button>
        </form>

        <div className="mt-8 text-center text-[18px] text-gray-600">
          Đã có tài khoản?{' '}
          <button 
            type="button" 
            onClick={() => navigate('/')} 
            className="font-semibold text-green-700 hover:underline"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>

      <SuccessModal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          navigate('/');
        }}
        title="Thành công!"
        message={`Chào mừng ${username}!\nHệ thống đã sẵn sàng xử lý tài liệu cho bạn.`}
        buttonText="Đến trang Đăng nhập" 
      />
    </div>
  );
};

export default RegisterPage;
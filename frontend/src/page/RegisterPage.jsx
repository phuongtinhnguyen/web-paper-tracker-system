import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import backgroundImg from '../assets/background.jpg'; 
import SuccessModal from '../components/SuccessModal'; 

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const navigate = useNavigate(); 

  const handleRegister = (e) => {
  e.preventDefault();
  
  if (password !== confirmPassword) {
    alert("Mật khẩu xác nhận không khớp!");
    return;
  }

  
  localStorage.setItem("username", username); 

  console.log("Gửi yêu cầu đăng ký:", { email, username, password });
  setShowModal(true); 
};

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <div className="absolute inset-0 bg-black/10"></div> 

      <div 
        className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20"
        style={{ width: '450px', minHeight: '700px' }} 
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Tạo tài khoản</h1>
          <p className="text-[20px] text-gray-600 mt-3">Tham gia cùng chúng tôi ngay hôm nay</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-[15px]">
          
          <div>
            <label className="block text-[18px] font-semibold text-gray-700 ml-4 mb-1">Tên người dùng</label>
            <input
              type="text"
              required
              className="block mx-auto w-11/12 px-5 py-3 text-lg rounded-xl border border-gray-300 outline-none bg-white/50"
              placeholder="Ví dụ: nva123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 ml-4 mb-1">Email của bạn</label>
            <input
              type="email"
              required
              className="block mx-auto w-11/12 px-5 py-3 text-lg rounded-xl border border-gray-300 outline-none bg-white/50"
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
              className="block mx-auto w-11/12 px-5 py-3 text-lg rounded-xl border border-gray-300 outline-none bg-white/50"
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
              className="block mx-auto w-11/12 px-5 py-3 text-lg rounded-xl border border-gray-300 outline-none bg-white/50"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            className="block mt-4 mx-auto w-11/12 !bg-green-600 hover:!bg-green-700 text-white text-[20px] font-bold py-4 rounded-xl transition duration-300 shadow-lg active:scale-[0.98]"
          >
            Đăng ký ngay
          </button>
        </form>

        <div className="mt-8 text-center text-[18px] text-gray-600">
          Đã có tài khoản?{' '}
          <button 
            type="button" 
            onClick={() => navigate('/')} 
            className="font-semibold text-indigo-600 hover:underline"
          >
            Đăng nhập tại đây
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
        message={`Chào mừng ${username}!\nTài khoản ${email} đã được tạo thành công.`}
        buttonText= "Đăng nhập ngay" 
      />
    </div>
  );
};

export default RegisterPage;
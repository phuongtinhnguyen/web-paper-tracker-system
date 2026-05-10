import axios from 'axios';


const API = axios.create({
  // Đây là nơi lưu địa chỉ "nhà" của bạn BE
  baseURL: 'http://localhost:8000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (credentials) => API.post('/auth/login', credentials);

export default API;
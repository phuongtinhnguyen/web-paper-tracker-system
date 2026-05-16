const SuccessModal = ({ isOpen, onClose, title, message, buttonText = "OK" }) => {
  if (!isOpen) return null; // Nếu không mở thì không vẽ gì cả

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>
      
    
      <div className="relative bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-white/20 transform scale-100 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold">
          ✓
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-8 text-lg whitespace-pre-line">
          {message}
        </p>
        <button 
          onClick={onClose}
          className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-xl hover:bg-green-700 transition duration-300 shadow-lg active:scale-95"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
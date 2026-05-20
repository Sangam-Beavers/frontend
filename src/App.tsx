import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>홈</div>} />
      <Route path="/login" element={<div>로그인</div>} />
    </Routes>
  );
}

export default App;

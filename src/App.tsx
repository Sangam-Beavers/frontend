import { useState } from 'react';
import Router from '@/routes/Router';
import SplashScreen from '@/components/common/SplashScreen';

function App() {
  // 앱 첫 진입 시 스플래시 표시. duration 후 스스로 페이드아웃하고 onFinish로 언마운트.
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '430px',
        minHeight: '100dvh',
        position: 'relative',
        background: '#fff',
      }}
    >
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <Router />
    </div>
  );
}

export default App;

import Router from '@/routes/Router';

function App() {
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
      <Router />
    </div>
  );
}

export default App;

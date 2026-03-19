import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import AppRouter from './router';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>문제가 발생했습니다</h2>
      <p>{error instanceof Error ? error.message : '알 수 없는 오류'}</p>
      <button onClick={resetErrorBoundary}>다시 시도</button>
    </div>
  );
}

const App = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
    </ErrorBoundary>
  );
};

export default App;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.tsx';
import { isDemoMode } from './demo/config';

if (!isDemoMode()) {
  registerSW({
    immediate: true,
    onRegistered(registration) {
      console.info('[PWA] SW registered', registration);
    },
    onRegisterError(error) {
      console.error('[PWA] SW register error', error);
    },
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

// MSW 목업 활성화 - VITE_ENABLE_MSW=true 일 때만 동작
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { worker } = await import('./mocks/browser');
    return worker.start({
      onUnhandledRequest(request, print) {
        // /api/* 경로만 에러 처리, 페이지 네비게이션·정적 자산은 통과
        if (new URL(request.url).pathname.startsWith('/api/')) {
          print.error();
        }
      },
    });
  }

  return undefined;
}

async function bootstrap() {
  if (isDemoMode()) {
    const { startDemoWorker } = await import('./demo/browser');
    await startDemoWorker();
  } else {
    await enableMocking();
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>
  );
}

void bootstrap();

import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import '@/index.css';
import { NavBar } from '@/components/layout/navbar.tsx';
import { Toaster } from './components/ui/toaster';
import { Providers } from './providers';

const App = lazy(() => import('@/App.tsx'));
const AdminPanel = lazy(() => import('@/pages/Admin.tsx'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <main className='w-full h-full min-h-screen flex flex-col flex-1'>
          <NavBar />
          <div className='flex-1 flex items-center justify-center'>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
                  <p className="text-gray-400">Cargando...</p>
                </div>
              </div>
            }>
              <Routes>
                <Route index element={<App />} />
                <Route path='/admin' element={<AdminPanel />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </BrowserRouter>
      <Toaster />
    </Providers>
  </StrictMode>
);

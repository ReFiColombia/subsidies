import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import '@/index.css';
import { NavBar } from '@/components/layout/navbar.tsx';
import App from '@/App.tsx';
import AdminPanel from '@/pages/Admin.tsx';
import { Toaster } from './components/ui/toaster';
import { Providers } from './providers';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <main className='w-full h-full min-h-screen flex flex-col flex-1'>
          <NavBar />
          <div className='flex-1 flex items-center justify-center'>
            <Routes>
              <Route index element={<App />} />
              <Route path='/admin' element={<AdminPanel />} />
            </Routes>
          </div>
        </main>
      </BrowserRouter>
      <Toaster />
    </Providers>
  </StrictMode>
);

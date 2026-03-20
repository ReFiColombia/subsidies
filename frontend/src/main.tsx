import '@/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route,Routes } from 'react-router'

import { App } from '@/App'
import { NavBar } from '@/components/layout/Navbar'
import { AdminPanel } from '@/pages/Admin'

import { Toaster } from './components/ui/toaster'
import { Providers } from './providers'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <main className="flex h-full min-h-screen w-full flex-1 flex-col">
          <NavBar />
          <div className="flex flex-1 items-center justify-center">
            <Routes>
              <Route index element={<App />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </div>
        </main>
      </BrowserRouter>
      <Toaster />
    </Providers>
  </StrictMode>
)

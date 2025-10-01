import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles.css'
import AdminLayout from './pages/AdminLayout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Seats from './pages/Seats'
import Reports from './pages/Reports'

const router = createBrowserRouter([
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'settings', element: <Settings /> },
      { path: 'seats', element: <Seats /> },
      { path: 'reports', element: <Reports /> },
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)


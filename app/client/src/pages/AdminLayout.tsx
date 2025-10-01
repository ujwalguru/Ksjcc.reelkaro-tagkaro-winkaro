import { Link, NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="min-h-full">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link to="/admin" className="text-primary font-semibold text-lg">Gaming Center Admin</Link>
          <nav className="flex gap-4 text-sm">
            <NavLink to="/admin" end className={({isActive})=> isActive? 'text-primary' : 'text-slate-300 hover:text-white'}>Dashboard</NavLink>
            <NavLink to="/admin/seats" className={({isActive})=> isActive? 'text-primary' : 'text-slate-300 hover:text-white'}>Seat Management</NavLink>
            <NavLink to="/admin/settings" className={({isActive})=> isActive? 'text-primary' : 'text-slate-300 hover:text-white'}>Settings</NavLink>
            <NavLink to="/admin/reports" className={({isActive})=> isActive? 'text-primary' : 'text-slate-300 hover:text-white'}>Reports</NavLink>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}


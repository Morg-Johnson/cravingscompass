import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
  { to: '/compare', label: 'Compare' },
  { to: '/saved-deals', label: 'Saved' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/rewards', label: 'Rewards' },
  { to: '/account', label: 'Account' },
  { to: '/route-deals', label: 'Route Deals' },
]

function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            CC
          </span>
          <span className="brand-name">Cravings Compass</span>
        </div>

        <nav className="app-nav" aria-label="Primary">
          {navItems.map((item) => {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `nav-link${isActive ? ' nav-link--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell

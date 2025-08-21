import { NavLink, Link, Outlet } from "react-router-dom";

export default function Layout() {
  // logo desde /public/assets/...
  const logoSrc = `${import.meta.env.BASE_URL}assets/Hay_Day_logo.png`;
  const logoSrc2 = `${import.meta.env.BASE_URL}assets/TitleLogo.png`;


  const linkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " nav-active" : "");

  return (
    <>
      <header className="hd-header">
        <div className="brand">
          
          <Link to="/" aria-label="Go to Home">
            <img src={logoSrc2} alt="HayDay Progress Tracker" className="logo-img2" />
          </Link>
          {/* <h1 style={{ margin: 0 }}>HayDay Progress Tracker</h1> */}
        </div>

        <nav className="nav">
          {/* <NavLink to="/" end className={linkClass}>Home</NavLink> */}
          <NavLink to="/production" className={linkClass}>Production</NavLink>
          <NavLink to="/products" className={linkClass}>Products</NavLink>
          <NavLink to="/animals" className={linkClass}>Animals</NavLink>
          <NavLink to="/animal-homes" className={linkClass}>Animal Homes</NavLink>
          <NavLink to="/crops" className={linkClass}>Crops</NavLink>
          <NavLink to="/expansion" className={linkClass}>Expansion</NavLink>
          <NavLink to="/fishing-area" className={linkClass}>Fishing</NavLink>
          <NavLink to="/town" className={linkClass}>Town</NavLink>
          <NavLink to="/achievements" className={linkClass}>Achievements</NavLink>
          <NavLink to="/trees-bushes" className={linkClass}>Trees & Bushes</NavLink>
        </nav>
      </header>

      <Outlet />

      <footer className="hd-footer">
        <small>Saved to your browser automatically • v0.2</small>
      </footer>
    </>
  );
}

// src/components/Layout.jsx
import { NavLink, Link, Outlet } from "react-router-dom";

export default function Layout() {
  const logoSrc2 = `${import.meta.env.BASE_URL}assets/TitleLogo.png`;
  const buttonImg = `${import.meta.env.BASE_URL}assets/button.png`;

  const linkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " nav-active" : "");

  return (
    <>
      <header className="hd-header">
        <div className="brand">
          <Link to="/" aria-label="Go to Home">
            <img
              src={logoSrc2}
              alt="HayDay Progress Tracker"
              className="logo-img2"
            />
          </Link>
        </div>

        <nav className="nav">
          <NavLink to="/production" className={linkClass}>
            <img src={buttonImg} alt="" className="nav-btn-img" />
            <span className="nav-btn-text">Production</span>
          </NavLink>
          <NavLink to="/products" className={linkClass}>
            <img src={buttonImg} alt="" className="nav-btn-img" />
            <span className="nav-btn-text">Products</span>
          </NavLink>
          <NavLink to="/animals" className={linkClass}>
            <img src={buttonImg} alt="" className="nav-btn-img" />
            <span className="nav-btn-text">Animals</span>
          </NavLink>
          <NavLink to="/animal-homes" className={linkClass}>
            <img src={buttonImg} alt="" className="nav-btn-img" />
            <span className="nav-btn-text">Animal Homes</span>
          </NavLink>
          <NavLink to="/crops" className={linkClass}>
            <img src={buttonImg} alt="" className="nav-btn-img" />
            <span className="nav-btn-text">Crops</span>
          </NavLink>
          <NavLink to="/expansion" className={linkClass}>
            <img src={buttonImg} alt="" className="nav-btn-img" />
            <span className="nav-btn-text">Expansion</span>
          </NavLink>
          <NavLink to="/fishing-area" className={linkClass}>
            <img src={buttonImg} alt="" className="nav-btn-img" />
            <span className="nav-btn-text">Fishing</span>
          </NavLink>
          <NavLink to="/town" className={linkClass}>
            <img src={buttonImg} alt="" className="nav-btn-img" />
            <span className="nav-btn-text">Town</span>
          </NavLink>
          <NavLink to="/achievements" className={linkClass}>
            <img src={buttonImg} alt="" className="nav-btn-img" />
            <span className="nav-btn-text">Achievements</span>
          </NavLink>
          <NavLink to="/trees-bushes" className={linkClass}>
            <img src={buttonImg} alt="" className="nav-btn-img" />
            <span className="nav-btn-text">Trees & Bushes</span>
          </NavLink>
        </nav>
      </header>

      <Outlet />

      <footer className="hd-footer">
        <small>Saved to your browser automatically • v0.2</small>
      </footer>
    </>
  );
}

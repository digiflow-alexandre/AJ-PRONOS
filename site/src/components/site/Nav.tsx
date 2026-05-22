"use client";

import { useEffect, useState } from "react";
import { navLinks } from "@/lib/data";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close mobile menu on hash link click
  const closeMenu = () => setOpen(false);

  return (
    <>
      <nav
        className={`nav${scrolled ? " scrolled" : ""}`}
        aria-label="Navigation principale"
      >
        <div className="wrap nav-inner">
          <a href="/" className="nav-pill nav-pill--logo" aria-label="AJ Pronos — Accueil">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/aj-pronos-logo.png"
              alt="AJ Pronos"
              className="logo-img"
              width="42"
              height="51"
            />
          </a>
          <ul className="nav-pill nav-pill--links">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
          <a href="/#tarifs" className="nav-pill nav-pill--cta">
            Commencer
          </a>
          <button
            type="button"
            className="burger"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
          </button>
        </div>
      </nav>

      <div
        className={`mobile-menu${open ? " open" : ""}`}
        id="mobile-menu"
        aria-hidden={!open}
      >
        <ul>
          {navLinks.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={closeMenu}>
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href="/#tarifs" className="btn btn-primary" onClick={closeMenu}>
              Commencer
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}

export default Nav;

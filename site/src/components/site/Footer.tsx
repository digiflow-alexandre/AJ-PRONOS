export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-hero">
          <a href="/" className="footer-logo" aria-label="AJ Pronos — Accueil">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/aj-pronos-logo-white.png"
              alt="AJ Pronos"
              className="footer-logo-img"
              width="928"
              height="1152"
            />
          </a>
          <p className="footer-tagline">
            Conseil en paris sportifs. Expertise humaine, methode rigoureuse,
            ROI public. Communication sur WhatsApp Business.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Liens du site">
          <a href="/methode">Methode</a>
          <span className="footer-nav-sep" aria-hidden="true">·</span>
          <a href="/resultats">Resultats publics</a>
          <span className="footer-nav-sep" aria-hidden="true">·</span>
          <a href="/#tarifs">Tarifs</a>
          <span className="footer-nav-sep" aria-hidden="true">·</span>
          <a href="/#faq">FAQ</a>
          <span className="footer-nav-sep" aria-hidden="true">·</span>
          <a href="/contact">Contact</a>
          <span className="footer-nav-sep" aria-hidden="true">·</span>
          <a href="/mentions-legales">Mentions legales</a>
          <span className="footer-nav-sep" aria-hidden="true">·</span>
          <a href="/cgv">CGV</a>
          <span className="footer-nav-sep" aria-hidden="true">·</span>
          <a href="/confidentialite">Confidentialite</a>
          <span className="footer-nav-sep" aria-hidden="true">·</span>
          <a href="/cookies">Cookies</a>
        </nav>

        <div className="legal-strip">
          <p>
            <strong>
              Les paris sportifs comportent des risques d&apos;addiction et de
              pertes financieres. Reserve aux +18 ans.
            </strong>
          </p>
          <p>
            Si vous avez un probleme avec le jeu : Joueurs Info Service,{" "}
            <a href="tel:0974751313">09 74 75 13 13</a> —{" "}
            <a
              href="https://www.joueurs-info-service.fr"
              rel="noopener noreferrer"
              target="_blank"
            >
              joueurs-info-service.fr
            </a>
          </p>
        </div>

        <div className="copyright">
          <span>© 2026 AJ Pronos — Tous droits reserves</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

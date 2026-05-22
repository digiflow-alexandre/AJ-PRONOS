export function HeroMockup() {
  return (
    <div className="hero-mockup" aria-hidden="true">
      {/* Card gauche — gros icône trophée or avec halo + texte centré (style Habitline streak) */}
      <div className="hero-mockup__card hero-mockup__card--left">
        <div className="hero-mockup__icon-glow">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 4v3a5 5 0 0 0 5 5 5 5 0 0 0 5-5V4H7zm10 3a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V6h10v1z" />
            <path d="M11 13v3H8v2h8v-2h-3v-3h-2z" />
          </svg>
        </div>
        <div className="hero-mockup__caption">
          <strong>+77,50 &euro;</strong>
          <span>Leicester &middot; WBA</span>
        </div>
      </div>

      {/* Phone mockup */}
      <img
        src="/hero-mockup.png"
        alt=""
        className="hero-mockup__phone"
        loading="eager"
      />

      {/* Card droite — titre + 3 mini stats sport (style Habitline today's goal) */}
      <div className="hero-mockup__card hero-mockup__card--right">
        <div className="hero-mockup__title">Performance &middot; 30 jours</div>
        <div className="hero-mockup__stats-row">
          <div className="hero-mockup__stat">
            <div className="hero-mockup__stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 6.5l3.4 2.5-1.3 4h-4.2L8.6 9l3.4-2.5zM12 6.5V3M15.9 9L19 7M14.1 13L16 17M9.9 13L8 17M8.1 9L5 7" />
              </svg>
            </div>
            <span>67%</span>
          </div>
          <div className="hero-mockup__stat">
            <div className="hero-mockup__stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3v18" />
                <path d="M5.5 5.5c3.5 3.5 9.5 3.5 13 0M5.5 18.5c3.5-3.5 9.5-3.5 13 0" />
              </svg>
            </div>
            <span>58%</span>
          </div>
          <div className="hero-mockup__stat">
            <div className="hero-mockup__stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12c0-5 4-9 9-9M21 12c0 5-4 9-9 9" />
              </svg>
            </div>
            <span>72%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroMockup;

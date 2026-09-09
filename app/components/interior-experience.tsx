"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { KitchenScene } from "./kitchen-scene";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      aria-hidden="true"
    >
      {diagonal ? (
        <path d="M6 18 18 6M6 6h12v12" />
      ) : (
        <path d="M4 12h15m-6-6 6 6-6 6" />
      )}
    </svg>
  );
}

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a
      className={`brand ${footer ? "brand-footer" : ""}`}
      href="#home"
      aria-label="Divora Interiors home"
    >
      <svg
        className="brand-mark"
        viewBox="0 0 38 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        aria-hidden="true"
      >
        <path d="M6 3h11c12 0 17 8 17 19S29 41 17 41H6V3Z" />
        <path d="M1 9h14c9 0 13 5 13 13s-4 13-13 13H1V9Zm11-6v38" />
      </svg>
      <span>
        <span className="brand-name">
          divora<span className="brand-period">.</span>
        </span>
        <span className="brand-subtitle">INTERIORS</span>
      </span>
    </a>
  );
}

const materials = [
  {
    number: "01",
    category: "HONEST MATERIALS",
    title: "Beauty you can feel.",
    text: "Rich walnut, softly veined stone, and finishes that grow more beautiful with everyday life.",
    crop: "material-wood",
  },
  {
    number: "02",
    category: "INTELLIGENT DESIGN",
    title: "Everything in its place.",
    text: "Considered proportions and concealed storage. A kitchen that works as beautifully as it looks.",
    crop: "material-storage",
  },
  {
    number: "03",
    category: "THOUGHTFUL DETAILS",
    title: "A warmer welcome.",
    text: "Layered light and quiet details that turn the room you use most into the room you love most.",
    crop: "material-light",
  },
];

export function InteriorExperience() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [briefSaved, setBriefSaved] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const copyTimeRef = useRef(-1);

  const updateHeroCopy = useCallback((time: number) => {
    // Follow the kitchen's clock, including pauses and offscreen suspension.
    // Once revealed, copy stays readable during comparisons and replays.
    if (time <= copyTimeRef.current || !heroRef.current) return;
    copyTimeRef.current = time;
    const reveal = (start: number, duration: number) => {
      const progress = Math.max(0, Math.min(1, (time - start) / duration));
      return 1 - Math.pow(1 - progress, 3);
    };
    for (const [name, progress] of [
      ["intro", reveal(150, 1100)],
      ["reimagined", reveal(5500, 1500)],
      ["description", reveal(7000, 1000)],
    ] as const) {
      heroRef.current.style.setProperty(`--${name}-opacity`, String(progress));
      heroRef.current.style.setProperty(
        `--${name}-offset`,
        `${8 * (1 - progress)}px`,
      );
    }
  }, []);

  const openBrief = () => {
    setMenuOpen(false);
    setBriefSaved(false);
    dialogRef.current?.showModal();
  };

  function saveBrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const content = [
      "DIVORA — YOUR DESIGN BRIEF",
      "",
      `Name: ${data.get("name")}`,
      `Email: ${data.get("email")}`,
      `Space: ${data.get("space")}`,
      `Your vision: ${data.get("vision") || "To be explored together."}`,
      "",
      "Saved for your first design conversation. This brief has not been sent to Divora.",
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-divora-design-brief.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBriefSaved(true);
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header" id="home">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          <a className="nav-active" href="#spaces">
            Our spaces
            <span />
          </a>
          <a href="#philosophy">Our philosophy</a>
          <a href="#process">The process</a>
        </nav>
        <button className="header-cta" onClick={openBrief}>
          Let’s create your space <Arrow diagonal />
        </button>
        <button
          className="menu-toggle"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>
        {menuOpen && (
          <nav
            className="mobile-nav"
            id="mobile-navigation"
            aria-label="Mobile navigation"
          >
            <a href="#spaces" onClick={() => setMenuOpen(false)}>
              Our spaces
            </a>
            <a href="#philosophy" onClick={() => setMenuOpen(false)}>
              Our philosophy
            </a>
            <a href="#process" onClick={() => setMenuOpen(false)}>
              The process
            </a>
            <button onClick={openBrief}>
              Let’s create your space <Arrow diagonal />
            </button>
          </nav>
        )}
      </header>

      <main id="main">
        <section
          ref={heroRef}
          className="hero"
          id="spaces"
          aria-labelledby="hero-heading"
        >
          <noscript>
            <style>{`.hero-copy-reveal { opacity: 1 !important; transform: none !important; }`}</style>
          </noscript>
          <KitchenScene onTimelineUpdate={updateHeroCopy} />
          <div className="hero-content">
            <div className="eyebrow">
              <span /> CONSIDERED DESIGN. EXTRAORDINARY LIVING.
            </div>
            <h1 id="hero-heading">
              <span className="hero-copy-reveal hero-intro">Your space.</span>
              <br />
              <em className="hero-copy-reveal hero-reimagined">Reimagined.</em>
            </h1>
            <p className="hero-description hero-copy-reveal">
              The home you imagine begins with the space you have. We bring out
              its extraordinary.
            </p>
            <div className="hero-actions">
              <button className="button button-cream" onClick={openBrief}>
                Discover your possibilities <Arrow diagonal />
              </button>
              <a className="quiet-link" href="#philosophy">
                The Divora approach <Arrow />
              </a>
            </div>
            <div className="hero-note">
              <span className="note-symbol" aria-hidden="true">
                ✳
              </span>{" "}
              Thoughtfully designed. Beautifully lived in.
            </div>
          </div>
          <div className="hero-footnote">
            <span>01 / THE KITCHEN, RECONSIDERED</span>
            <a href="#philosophy">
              SCROLL TO DISCOVER <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="vertical-caption" aria-hidden="true">
            ORDINARY SPACES. EXTRAORDINARY POSSIBILITIES.
          </div>
        </section>

        <div className="values-strip" aria-label="Our design principles">
          <span>Designed around you</span>
          <span className="strip-star" aria-hidden="true">
            ✳
          </span>
          <span>Materials with character</span>
          <span className="strip-star" aria-hidden="true">
            ✳
          </span>
          <span>Every detail, considered</span>
          <span className="strip-star" aria-hidden="true">
            ✳
          </span>
          <span>Made for everyday living</span>
        </div>

        <section
          className="philosophy section-shell"
          id="philosophy"
          aria-labelledby="philosophy-heading"
        >
          <div className="section-intro">
            <div>
              <span className="eyebrow dark-eyebrow">
                <span /> THE DIVORA DIFFERENCE
              </span>
              <h2 id="philosophy-heading">
                More than a new kitchen.
                <br />
                <em>A new way to feel at home.</em>
              </h2>
            </div>
            <p>
              Good design isn’t just what you see.
              <br />
              It’s how effortlessly your day unfolds.
              <br />
              We consider every detail, so you don’t have to.
            </p>
          </div>
          <div className="material-grid">
            {materials.map((material) => (
              <article className="material-card" key={material.number}>
                <div className={`material-image ${material.crop}`}>
                  <Image
                    src="/images/kitchen-after-v2.webp"
                    alt={
                      material.number === "01"
                        ? "Natural walnut grain and warm limestone in the kitchen concept"
                        : material.number === "02"
                          ? "Precisely aligned ivory drawers and concealed kitchen storage"
                          : "Warm architectural lighting across the stone backsplash"
                    }
                    fill
                    sizes="(max-width: 700px) 90vw, 31vw"
                  />
                  <span className="material-number">{material.number}</span>
                </div>
                <div className="material-copy">
                  <span className="tiny-label">{material.category}</span>
                  <h3>{material.title}</h3>
                  <p>{material.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="process section-shell"
          id="process"
          aria-labelledby="process-heading"
        >
          <div className="process-intro">
            <span className="eyebrow dark-eyebrow">
              <span /> FROM YOUR VISION TO YOUR EVERYDAY
            </span>
            <h2 id="process-heading">
              A thoughtful journey.
              <br />
              <em>A personal result.</em>
            </h2>
            <button className="quiet-link dark-link" onClick={openBrief}>
              Let’s start with your space <Arrow diagonal />
            </button>
          </div>
          <div className="process-steps">
            <details open>
              <summary>
                <span>01</span> We listen.
                <span className="details-plus">+</span>
              </summary>
              <p>
                Your routines, your favourite things, your wish list. We begin
                by understanding how you want to live.
              </p>
            </details>
            <details>
              <summary>
                <span>02</span> We imagine.
                <span className="details-plus">+</span>
              </summary>
              <p>
                We explore layouts, materials, storage, and lighting as one
                considered design, shaped around your space.
              </p>
            </details>
            <details>
              <summary>
                <span>03</span> We bring it home.
                <span className="details-plus">+</span>
              </summary>
              <p>
                From the final finish to the last handle, the details come
                together to create a home that feels like you.
              </p>
            </details>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <Brand footer />
        <p>Ordinary spaces. Extraordinary possibilities.</p>
        <a href="#home">
          Back to the beginning <span aria-hidden="true">↑</span>
        </a>
        <span className="copyright">
          © {new Date().getFullYear()} Divora Interiors
        </span>
      </footer>

      <dialog
        ref={dialogRef}
        className="brief-dialog"
        aria-labelledby="brief-heading"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <button
          className="dialog-close"
          aria-label="Close design brief"
          onClick={() => dialogRef.current?.close()}
        >
          ×
        </button>
        <span className="eyebrow dark-eyebrow">
          <span /> YOUR NEXT CHAPTER
        </span>
        <h2 id="brief-heading">
          Let’s make room
          <br />
          <em>for you.</em>
        </h2>
        {briefSaved ? (
          <div className="brief-success" role="status">
            <span className="success-mark">✓</span>
            <h3>Your ideas, ready to build on.</h3>
            <p>
              Your design brief has been downloaded. Keep it for your first
              design conversation. Your details have not been sent or stored.
            </p>
            <button
              className="button button-green"
              onClick={() => dialogRef.current?.close()}
            >
              Back to the possibilities <Arrow />
            </button>
          </div>
        ) : (
          <>
            <p className="dialog-description">
              A beautiful space starts with a little inspiration. Create a brief
              to keep for your first design conversation.
            </p>
            <form onSubmit={saveBrief}>
              <div className="form-row">
                <label>
                  Your name
                  <input
                    autoComplete="name"
                    name="name"
                    placeholder="Alex Taylor"
                    required
                    maxLength={100}
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    autoComplete="email"
                    name="email"
                    placeholder="alex@example.com"
                    required
                    maxLength={254}
                  />
                </label>
              </div>
              <label>
                Your space
                <select name="space" defaultValue="Kitchen">
                  <option>Kitchen</option>
                  <option>Living space</option>
                  <option>Bedroom</option>
                  <option>Complete home</option>
                </select>
              </label>
              <label>
                What would you love to change?
                <textarea
                  name="vision"
                  placeholder="More room to cook, better storage, a warmer feeling…"
                  rows={3}
                  maxLength={3000}
                />
              </label>
              <button type="submit" className="button button-green">
                Save my design brief <Arrow diagonal />
              </button>
              <p className="form-note">
                Downloads to your device. No details are sent or stored.
              </p>
            </form>
          </>
        )}
      </dialog>
    </>
  );
}

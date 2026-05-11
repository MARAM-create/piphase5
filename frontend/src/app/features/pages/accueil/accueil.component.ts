import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],

  // ══════════════════════════════════════════════════════════
  //  ALL STYLES INLINED
  // ══════════════════════════════════════════════════════════
  styles: [`

    /* ── CSS VARIABLES ── */
    :host {
      --forest:     #1C3D2A;
      --forest-mid: #2A5C3F;
      --green:      #357A52;
      --green-lt:   #5FA878;
      --gold:       #B8922A;
      --gold-lt:    #D4AF5A;
      --white:      #FFFFFF;
      --cream:      #F8F5EF;
      --cream-dk:   #EEE8DC;
      --stone:      #7A8A80;
      --ink:        #1a1a2e;
      --sage:       #A8C8B4;
      --mint:       #EEF7F1;
      --radius:     10px;
      --radius-lg:  18px;
      --shadow:     0 2px 12px rgba(28,61,42,.08);
      --shadow-lg:  0 10px 36px rgba(28,61,42,.14);
      display: block;
      font-family: 'Jost', 'Plus Jakarta Sans', sans-serif;
    }

    /* ── AUTH WALL ── */
    .mur-overlay {
      position: fixed; inset: 0; z-index: 200;
      display: flex; align-items: center; justify-content: center; padding: 16px;
      background: rgba(0,0,0,0.78); backdrop-filter: blur(10px);
    }
    .mur-modal {
      background: #fff; border-radius: 24px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.35);
      width: 100%; max-width: 360px; overflow: hidden;
    }
    .mur-head {
      padding: 36px 32px 28px; text-align: center;
      background: linear-gradient(145deg, #0f3d1a, #1a5c2a);
    }
    .mur-icon {
      width: 64px; height: 64px; border-radius: 16px;
      background: rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 18px; overflow: hidden;
    }
    .mur-icon img {
      width: 100%; height: 100%; object-fit: cover;
    }
    .mur-head h2 { font-size: 22px; font-weight: 900; color: #fff; margin: 0 0 6px; }
    .mur-head p  { font-size: 13px; color: rgba(255,255,255,0.8); margin: 0; line-height: 1.55; }
    .mur-body    { padding: 28px 28px 24px; }
    .btn-mur-primary {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 14px;
      background: linear-gradient(135deg,#0f3d1a,#1a5c2a);
      color: #fff; font-size: 14px; font-weight: 700;
      border: none; border-radius: 14px; cursor: pointer;
      text-decoration: none; margin-bottom: 10px;
      transition: transform .2s, box-shadow .2s;
      font-family: inherit;
    }
    .btn-mur-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,61,26,0.35); }
    .btn-mur-secondary {
      display: flex; align-items: center; justify-content: center;
      width: 100%; padding: 14px;
      background: transparent; color: #374151; font-size: 14px; font-weight: 700;
      border: 2px solid #e5e7eb; border-radius: 14px; cursor: pointer;
      text-decoration: none; transition: background .2s, border-color .2s;
      font-family: inherit;
    }
    .btn-mur-secondary:hover { background: #f9fafb; border-color: #d1d5db; }
    .btn-mur-close {
      display: block; width: 100%; margin-top: 16px; padding: 8px;
      background: none; border: none; cursor: pointer;
      color: #9ca3af; font-size: 12px; transition: color .2s; font-family: inherit;
    }
    .btn-mur-close:hover { color: #6b7280; }

    /* ── NAVBAR ── */
    .navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      height: 70px; padding: 0 5%;
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(255,255,255,.97);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(168,200,180,.3);
      transition: box-shadow .3s;
    }
    .navbar.is-scrolled { box-shadow: 0 2px 24px rgba(28,61,42,.09); }
    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .brand-mark {
      width: 50px; height: 50px; border-radius: 8px;
      background: var(--forest);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; overflow: hidden;
    }
    .brand-mark img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .brand-name {
      font-family: 'Libre Baskerville', serif;
      font-size: 21px; font-weight: 700;
      color: var(--forest); letter-spacing: .2px;
    }
    .brand-name span { color: var(--gold); }
    .nav-links { display: flex; align-items: center; gap: 2px; }
    .nav-link {
      padding: 8px 16px; border-radius: var(--radius);
      font-size: 14.8px; font-weight: 500; color: var(--stone);
      text-decoration: none; border: none; background: none;
      font-family: inherit; cursor: pointer; letter-spacing: .2px;
      transition: color .2s, background .2s;
    }
    .nav-link:hover { color: var(--forest); background: var(--mint); }
    .nav-actions { display: flex; align-items: center; gap: 10px; }
    .btn-nav-ghost {
      padding: 8px 18px; border-radius: var(--radius);
      font-size: 13px; font-weight: 600; letter-spacing: .3px;
      color: var(--forest); border: 1.5px solid var(--sage);
      background: transparent; cursor: pointer;
      font-family: inherit; text-decoration: none; transition: all .2s;
    }
    .btn-nav-ghost:hover { background: var(--mint); border-color: var(--green-lt); }
    .btn-nav-fill {
      padding: 8px 20px; border-radius: var(--radius);
      font-size: 13px; font-weight: 700; letter-spacing: .3px;
      color: #fff; border: none;
      background: linear-gradient(135deg, var(--forest), var(--green));
      cursor: pointer; font-family: inherit; text-decoration: none; transition: all .2s;
    }
    .btn-nav-fill:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(28,61,42,0.3); }

    /* ── HERO ── */
    .hero {
      position: relative; height: 100vh; min-height: 640px; overflow: hidden;
    }
    .hero-video {
      position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(150deg,rgba(14,30,20,.72) 0%,rgba(22,48,32,.50) 45%,rgba(12,26,18,.68) 100%);
    }
    .hero-vignette {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.35) 100%);
    }
    .hero-body {
      position: relative; z-index: 2;
      height: calc(100% - 70px); margin-top: 70px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center; padding: 0 5%;
    }
    .hero-label {
      display: inline-flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18);
      backdrop-filter: blur(8px);
      padding: 6px 16px; border-radius: 2px;
      font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
      color: rgba(255,255,255,.8); margin-bottom: 28px;
    }
    .hero-label-dot {
      width: 6px; height: 6px; border-radius: 50%; background: var(--gold-lt);
      animation: blink 2.4s ease-in-out infinite;
    }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
    .hero h1 {
      font-family: 'Libre Baskerville', serif;
      font-size: clamp(42px, 6.5vw, 80px); font-weight: 700; line-height: 1.08;
      color: var(--white); letter-spacing: -.5px; margin-bottom: 20px;
      text-shadow: 0 2px 20px rgba(0,0,0,.2);
    }
    .hero h1 em { color: var(--gold-lt); font-style: italic; }
    .hero-sub {
      font-size: clamp(15px, 1.7vw, 17px); color: rgba(255,255,255,.68);
      max-width: 460px; line-height: 1.78; margin-bottom: 40px; font-weight: 400;
    }
    .hero-cta { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
    .btn-primary {
      padding: 14px 32px; background: var(--forest); color: var(--white);
      border: none; border-radius: var(--radius);
      font-size: 14px; font-weight: 600; letter-spacing: .4px;
      font-family: inherit; cursor: pointer;
      display: flex; align-items: center; gap: 12px;
      box-shadow: 0 8px 28px rgba(28,61,42,.45); transition: all .25s;
    }
    .btn-primary:hover { background: var(--forest-mid); transform: translateY(-2px); box-shadow: 0 12px 36px rgba(28,61,42,.5); }
    .btn-primary-arrow {
      width: 26px; height: 26px; border-radius: 4px;
      background: rgba(255,255,255,.12);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s;
    }
    .btn-primary:hover .btn-primary-arrow { transform: translateX(3px); }
    .btn-primary-arrow svg { width: 14px; height: 14px; stroke: white; stroke-width: 2.2; fill: none; }
    .btn-ghost {
      padding: 14px 28px;
      background: rgba(255,255,255,.1); color: rgba(255,255,255,.9);
      border: 1.5px solid rgba(255,255,255,.32); border-radius: var(--radius);
      font-size: 14px; font-weight: 500; font-family: inherit;
      cursor: pointer; backdrop-filter: blur(6px); transition: all .22s;
    }
    .btn-ghost:hover { background: rgba(255,255,255,.17); border-color: rgba(255,255,255,.65); }
    .scroll-cue {
      position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center; gap: 7px;
      z-index: 2; cursor: pointer;
    }
    .scroll-cue-track {
      width: 22px; height: 36px; border: 1.5px solid rgba(255,255,255,.28);
      border-radius: 11px; position: relative;
    }
    .scroll-cue-dot {
      position: absolute; top: 5px; left: 50%; transform: translateX(-50%);
      width: 4px; height: 7px; border-radius: 2px;
      background: rgba(255,255,255,.55); animation: scroll-dot 2s infinite;
    }
    @keyframes scroll-dot { 0% { opacity: 1; top: 5px; } 100% { opacity: 0; top: 20px; } }
    .scroll-cue-text { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,.35); }

    /* ── STATS BAND ── */
    .stats-band {
      background: var(--forest);
      display: grid; grid-template-columns: repeat(4, 1fr);
    }
    .stat-cell {
      padding: 30px 20px; text-align: center;
      border-right: 1px solid rgba(255,255,255,.07); position: relative; overflow: hidden;
    }
    .stat-cell:last-child { border-right: none; }
    .stat-cell::after {
      content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 0; height: 2px; background: var(--gold-lt); transition: width .35s;
    }
    .stat-cell:hover::after { width: 48px; }
    .stat-value {
      font-family: 'Libre Baskerville', serif;
      font-size: 34px; font-weight: 700; color: var(--gold-lt); line-height: 1;
    }
    .stat-label { font-size: 12px; color: rgba(255,255,255,.45); margin-top: 6px; letter-spacing: .4px; }

    /* ── ABOUT ── */
    .about { padding: 110px 5%; background: var(--cream); position: relative; overflow: hidden; }
    .leaf-deco { position: absolute; pointer-events: none; opacity: .10; }
    .leaf-deco.left  { bottom: -40px; left: -60px; width: 240px; transform: rotate(-12deg); }
    .leaf-deco.right { top: -40px; right: -60px; width: 240px; transform: rotate(170deg); }
    .about-inner {
      max-width: 1140px; margin: 0 auto;
      display: grid; grid-template-columns: 1fr 1.1fr; gap: 88px; align-items: start;
    }
    .section-eyebrow {
      display: inline-block; font-size: 10px; font-weight: 700;
      letter-spacing: 2.5px; text-transform: uppercase; color: var(--green);
      margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1.5px solid var(--gold-lt);
    }
    .about-left h2 {
      font-family: 'Libre Baskerville', serif;
      font-size: clamp(30px, 3.5vw, 46px); font-weight: 700; line-height: 1.18;
      color: var(--forest); margin-bottom: 20px; letter-spacing: -.3px;
    }
    .about-left h2 em { color: var(--gold); font-style: italic; }
    .about-left p { font-size: 15px; color: var(--stone); line-height: 1.85; margin-bottom: 32px; }
    .trust-row { display: flex; gap: 28px; flex-wrap: wrap; }
    .trust-item { display: flex; align-items: center; gap: 10px; }
    .trust-icon {
      width: 34px; height: 34px; border-radius: var(--radius);
      background: var(--white); border: 1px solid var(--cream-dk);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; box-shadow: var(--shadow);
    }
    .trust-icon svg { width: 16px; height: 16px; stroke: var(--green); stroke-width: 2; fill: none; }
    .trust-text strong { display: block; font-size: 13px; font-weight: 700; color: var(--forest); }
    .trust-text span   { font-size: 11px; color: var(--stone); letter-spacing: .1px; }
    .services-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .service-card {
      background: var(--white); border-radius: var(--radius-lg);
      padding: 24px 22px; border: 1px solid rgba(168,200,180,.4);
      box-shadow: var(--shadow); transition: transform .22s, box-shadow .22s;
      position: relative; overflow: hidden;
    }
    .service-card::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, var(--green), var(--green-lt));
      transform: scaleX(0); transform-origin: left; transition: transform .3s;
    }
    .service-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .service-card:hover::after { transform: scaleX(1); }
    .service-card.wide { grid-column: span 2; display: flex; align-items: center; gap: 20px; }
    .service-icon {
      width: 42px; height: 42px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-bottom: 14px; border: 1px solid rgba(168,200,180,.35);
    }
    .service-icon svg { width: 20px; height: 20px; stroke-width: 1.7; fill: none; }
    .service-card.wide .service-icon { margin-bottom: 0; width: 50px; height: 50px; }
    .service-card.wide .service-icon svg { width: 24px; height: 24px; }
    .si-green { background: #EEF7F1; border-color: rgba(95,168,120,.25) !important; }
    .si-gold  { background: #F7EDD8; border-color: rgba(184,146,42,.25) !important; }
    .si-blue  { background: #EEF4FF; border-color: rgba(90,143,201,.25) !important; }
    .service-card h3 { font-size: 14px; font-weight: 700; color: var(--forest); margin-bottom: 6px; letter-spacing: .1px; }
    .service-card p  { font-size: 12.5px; color: var(--stone); line-height: 1.68; }

    /* ── HOW IT WORKS ── */
    .how { padding: 110px 5%; background: var(--white); }
    .section-head { text-align: center; margin-bottom: 68px; }
    .section-head h2 {
      font-family: 'Libre Baskerville', serif;
      font-size: clamp(28px, 3.5vw, 44px); font-weight: 700; color: var(--forest);
      margin-top: 14px; letter-spacing: -.3px;
    }
    .section-head p { font-size: 15px; color: var(--stone); margin-top: 12px; max-width: 460px; margin-left: auto; margin-right: auto; line-height: 1.75; }
    .process-track {
      max-width: 960px; margin: 0 auto; display: flex; position: relative;
    }
    .process-track::before {
      content: ''; position: absolute;
      top: 36px; left: calc(10% + 18px); right: calc(10% + 18px); height: 1px;
      background: linear-gradient(90deg, transparent, var(--sage) 20%, var(--sage) 80%, transparent);
    }
    .process-step {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; text-align: center; padding: 0 8px; position: relative; z-index: 1;
    }
    .step-circle {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--white); border: 1.5px solid var(--sage);
      display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
      box-shadow: 0 4px 16px rgba(28,61,42,.1); transition: all .3s; position: relative;
    }
    .step-circle svg { width: 26px; height: 26px; stroke: var(--green); stroke-width: 1.6; fill: none; }
    .step-num {
      position: absolute; top: -5px; right: -5px;
      width: 20px; height: 20px; border-radius: 50%;
      background: var(--forest); color: var(--gold-lt);
      font-size: 9px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--white);
    }
    .process-step:hover .step-circle {
      background: var(--forest); border-color: var(--forest);
      transform: translateY(-4px) scale(1.06); box-shadow: 0 10px 28px rgba(28,61,42,.22);
    }
    .process-step:hover .step-circle svg { stroke: var(--gold-lt); }
    .process-step h3 { font-size: 14px; font-weight: 700; color: var(--forest); margin-bottom: 6px; letter-spacing: .1px; }
    .process-step p  { font-size: 12px; color: var(--stone); line-height: 1.65; max-width: 130px; }

    /* ── TESTIMONIALS ── */
    .testimonials { padding: 110px 5%; background: var(--white); text-align: center; }
    .testimonials .section-head { margin-bottom: 56px; }
    .testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; text-align: left; }
    .testi-card {
      background: var(--cream); border-radius: var(--radius-lg);
      padding: 30px; border: 1px solid var(--cream-dk); position: relative;
    }
    .quote-mark {
      font-family: 'Libre Baskerville', serif; font-size: 72px; line-height: 1;
      color: var(--sage); position: absolute; top: 14px; left: 22px;
      opacity: .55; pointer-events: none; user-select: none;
    }
    .testi-stars { display: flex; gap: 3px; margin-bottom: 16px; }
    .testi-stars svg { width: 13px; height: 13px; fill: var(--gold); stroke: none; }
    .testi-text {
      font-size: 13.5px; color: var(--ink); line-height: 1.82;
      font-style: italic; margin-bottom: 22px; position: relative; z-index: 1;
    }
    .testi-author { display: flex; align-items: center; gap: 10px; }
    .testi-av {
      width: 38px; height: 38px; border-radius: 8px;
      font-size: 12px; font-weight: 800; color: white;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .testi-name { font-size: 13px; font-weight: 700; color: var(--forest); }
    .testi-role { font-size: 11px; color: var(--stone); margin-top: 1px; }

    /* ── CTA BLOCK ── */
    .cta-wrap { padding: 0 5% 100px; }
    .cta-block {
      border-radius: 16px; overflow: hidden;
      background: linear-gradient(130deg, var(--forest) 0%, var(--forest-mid) 55%, #3E7A52 100%);
      padding: 76px 60px; text-align: center; position: relative;
    }
    .cta-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,.06); pointer-events: none; }
    .cta-ring.r1 { width: 420px; height: 420px; top: -120px; right: -80px; }
    .cta-ring.r2 { width: 260px; height: 260px; bottom: -80px; left: -50px; }
    .cta-label {
      display: inline-block; font-size: 10px; font-weight: 700;
      letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold-lt);
      margin-bottom: 18px; padding-bottom: 8px; border-bottom: 1px solid rgba(212,175,90,.4);
    }
    .cta-block h2 {
      font-family: 'Libre Baskerville', serif;
      font-size: clamp(26px, 4vw, 50px); font-weight: 700; color: var(--white);
      line-height: 1.12; margin-bottom: 16px; letter-spacing: -.3px;
    }
    .cta-block p { font-size: 16px; color: rgba(255,255,255,.68); max-width: 430px; margin: 0 auto 40px; line-height: 1.78; }
    .cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
    .btn-white {
      padding: 14px 32px; background: var(--white); color: var(--forest);
      border-radius: var(--radius); font-size: 14px; font-weight: 700;
      letter-spacing: .3px; border: none; cursor: pointer; font-family: inherit;
      box-shadow: 0 6px 20px rgba(0,0,0,.15); transition: all .22s; text-decoration: none;
    }
    .btn-white:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,.2); }
    .btn-ghost-white {
      padding: 14px 28px; background: transparent; color: rgba(255,255,255,.9);
      border: 1.5px solid rgba(255,255,255,.35); border-radius: var(--radius);
      font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit;
      transition: all .22s; text-decoration: none;
    }
    .btn-ghost-white:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.75); }

    /* ── FOOTER ── */
    footer { background: var(--forest); color: rgba(255,255,255,.55); padding: 60px 5% 28px; }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 52px; margin-bottom: 52px; }
    .footer-brand-name {
      font-family: 'Libre Baskerville', serif; font-size: 22px; font-weight: 700;
      color: var(--white); margin-bottom: 12px; display: block;
    }
    .footer-brand-name span { color: var(--gold-lt); }
    .footer-brand p { font-size: 13px; line-height: 1.78; max-width: 240px; }
    .footer-col h4 {
      font-size: 10px; font-weight: 700; color: rgba(255,255,255,.85);
      text-transform: uppercase; letter-spacing: 1.8px; margin-bottom: 18px;
    }
    .footer-col a {
      display: block; font-size: 13px; color: rgba(255,255,255,.45);
      text-decoration: none; margin-bottom: 11px; transition: color .2s; letter-spacing: .1px;
    }
    .footer-col a:hover { color: var(--gold-lt); }
    .footer-bottom {
      border-top: 1px solid rgba(255,255,255,.08); padding-top: 24px;
      display: flex; align-items: center; justify-content: space-between;
      font-size: 12px; letter-spacing: .2px;
    }
    .footer-bottom-links a {
      color: rgba(255,255,255,.3); text-decoration: none;
      margin-left: 24px; transition: color .2s;
    }
    .footer-bottom-links a:hover { color: rgba(255,255,255,.7); }

    /* ── RESPONSIVE ── */
    @media (max-width: 1024px) {
      .about-inner   { grid-template-columns: 1fr; gap: 52px; }
      .footer-grid   { grid-template-columns: 1fr 1fr; gap: 36px; }
    }
    @media (max-width: 760px) {
      .nav-links     { display: none; }
      .stats-band    { grid-template-columns: 1fr 1fr; }
      .services-grid { grid-template-columns: 1fr; }
      .service-card.wide { flex-direction: column; }
      .process-track::before { display: none; }
      .process-track { flex-wrap: wrap; gap: 28px; justify-content: center; }
      .testi-grid    { grid-template-columns: 1fr; }
      .cta-block     { padding: 52px 28px; }
      .footer-grid   { grid-template-columns: 1fr; gap: 28px; }
      .footer-bottom { flex-direction: column; gap: 14px; text-align: center; }
    }
  `],

  // ══════════════════════════════════════════════════════════
  //  TEMPLATE
  // ══════════════════════════════════════════════════════════
  template: `

  <!-- ══ AUTH WALL ══════════════════════════════════════════ -->
  <div *ngIf="afficherMur" class="mur-overlay">
    <div class="mur-modal">
      <div class="mur-head">
        <div class="mur-icon"><img src="assets/images/logo.png" alt="Locavia"></div>
        <h2>Rejoignez Locavia</h2>
        <p>La plateforme N°1 du logement étudiant en Tunisie</p>
      </div>
      <div class="mur-body">
        <a routerLink="/inscription" class="btn-mur-primary">
          ✨ Créer un compte gratuitement
        </a>
        <a routerLink="/connexion" class="btn-mur-secondary">
          Se connecter →
        </a>
        <button (click)="fermerMur()" class="btn-mur-close">
          Continuer à parcourir ✕
        </button>
      </div>
    </div>
  </div>

  <!-- ══ WHOLE PAGE — click triggers auth wall ══════════════ -->
  <div (click)="declencherMur()">

    <!-- ── NAVBAR ── -->
    <nav class="navbar" [class.is-scrolled]="scrolled">
      <a class="brand" href="#" (click)="$event.preventDefault()">
        <div class="brand-mark">
          <img src="assets/images/logo.png" alt="Locavia">
        </div>
        <span class="brand-name">Loca<span>via</span></span>
      </a>
      <div class="nav-links" (click)="$event.stopPropagation()">
        <a class="nav-link" routerLink="/location">Location & Colocation</a>
        <a class="nav-link" routerLink="/colocataires">Trouver vos colocataires</a>
        <a class="nav-link" routerLink="/services">Services</a>
        <a class="nav-link" routerLink="/visite">Visite en ligne</a>
        <a class="nav-link" routerLink="/reclamation">Reclamation</a>
        <a class="nav-link" routerLink="/guides">Guides</a>
      </div>
      <div class="nav-actions" (click)="$event.stopPropagation()">
        <a routerLink="/connexion"   class="btn-nav-ghost">Connexion</a>
        <a routerLink="/inscription" class="btn-nav-fill">S'inscrire →</a>
      </div>
    </nav>

    <!-- ══ HERO ══════════════════════════════════════════════ -->
    <section class="hero">
      <video class="hero-video" autoplay muted loop playsinline>
        <source src="assets/videos/home.mp4" type="video/mp4">
      </video>
      <div class="hero-overlay"></div>
      <div class="hero-vignette"></div>

      <div class="hero-body">
        <div class="hero-label">
          <span class="hero-label-dot"></span>
          Plus de 2 400 logements disponibles
        </div>
        <h1>
          Trouvez votre<br>
          logement <em>idéal</em>
        </h1>
        <p class="hero-sub">
          Location, colocation ou résidence étudiante —
          Une plateforme pensée pour les étudiants en Tunisie.
        </p>
        <div class="hero-cta">
          <button class="btn-primary" (click)="$event.stopPropagation(); scrollTo('listings')">
            Trouver un logement
            <span class="btn-primary-arrow">
              <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
          </button>
          <button class="btn-ghost" (click)="$event.stopPropagation(); scrollTo('how')">
            Visite virtuelle
          </button>
        </div>
      </div>

      <div class="scroll-cue" (click)="$event.stopPropagation(); scrollTo('stats')">
        <div class="scroll-cue-track"><div class="scroll-cue-dot"></div></div>
        <span class="scroll-cue-text">Découvrir</span>
      </div>
    </section>

    <!-- ══ STATS ══════════════════════════════════════════════ -->
    <div class="stats-band" id="stats">
      <div class="stat-cell">
        <div class="stat-value">2 400+</div>
        <div class="stat-label">Logements disponibles</div>
      </div>
      <div class="stat-cell">
        <div class="stat-value">8 500+</div>
        <div class="stat-label">Étudiants logés</div>
      </div>
      <div class="stat-cell">
        <div class="stat-value">97 %</div>
        <div class="stat-label">Taux de satisfaction</div>
      </div>
      <div class="stat-cell">
        <div class="stat-value">48 h</div>
        <div class="stat-label">Délai moyen de réponse</div>
      </div>
    </div>

    <!-- ══ ABOUT ══════════════════════════════════════════════ -->
    <section class="about" id="about">

      <svg class="leaf-deco left" viewBox="0 0 240 360" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M210 14C115 96 20 148 8 336c66-106 162-126 202-322Z" fill="#2A5C3F"/>
        <path d="M188 38C104 122 36 170 22 312" stroke="#2A5C3F" stroke-width="2.5"/>
        <path d="M164 74C93 148 50 188 44 276" stroke="#2A5C3F" stroke-width="1.5" opacity=".5"/>
      </svg>
      <svg class="leaf-deco right" viewBox="0 0 240 360" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M210 14C115 96 20 148 8 336c66-106 162-126 202-322Z" fill="#2A5C3F"/>
        <path d="M188 38C104 122 36 170 22 312" stroke="#2A5C3F" stroke-width="2.5"/>
      </svg>

      <div class="about-inner">
        <div class="about-left">
          <span class="section-eyebrow">Notre service</span>
          <h2>À propos de<br>notre <em>service</em></h2>
          <p>
            Nous vous aidons à trouver le logement parfait, que ce soit pour une
            location individuelle ou une colocation. Bénéficiez de services de
            qualité, de gestion simplifiée et de solutions adaptées à vos besoins.
          </p>
          <div class="trust-row">
            <div class="trust-item">
              <div class="trust-icon">
                <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div class="trust-text">
                <strong>100 % Sécurisé</strong>
                <span>Données protégées</span>
              </div>
            </div>
            <div class="trust-item">
              <div class="trust-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="trust-text">
                <strong>Réponse rapide</strong>
                <span>Sous 48 h garanties</span>
              </div>
            </div>
            <div class="trust-item">
              <div class="trust-icon">
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <div class="trust-text">
                <strong>Accompagné</strong>
                <span>De A à Z</span>
              </div>
            </div>
          </div>
        </div>

        <div class="services-grid">
          <div class="service-card">
            <div class="service-icon si-green">
              <svg viewBox="0 0 24 24" stroke="#357A52"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h3>Rechercher</h3>
            <p>Filtres intelligents par ville, budget, superficie et type pour trouver exactement ce qu'il vous faut.</p>
          </div>
          <div class="service-card">
            <div class="service-icon si-gold">
              <svg viewBox="0 0 24 24" stroke="#B8922A"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </div>
            <h3>Postuler</h3>
            <p>Envoyez votre dossier complet en quelques minutes et suivez vos candidatures en temps réel.</p>
          </div>
          <div class="service-card wide">
            <div class="service-icon si-blue">
              <svg viewBox="0 0 24 24" stroke="#3A5FA8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </div>
            <div>
              <h3>Visite en ligne</h3>
              <p>Visitez les logements depuis chez vous grâce à nos visites virtuelles en haute définition, sans vous déplacer.</p>
            </div>
          </div>
          <div class="service-card">
            <div class="service-icon si-gold">
              <svg viewBox="0 0 24 24" stroke="#B8922A"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <h3>Paiement</h3>
            <p>Réglez votre loyer en ligne de manière sécurisée, avec rappels automatiques et historique complet.</p>
          </div>
          <div class="service-card">
            <div class="service-icon si-green">
              <svg viewBox="0 0 24 24" stroke="#357A52"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21V12h6v9" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3>Emménagement</h3>
            <p>Signez votre contrat et gérez l'état des lieux directement depuis votre espace Locavia.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ HOW ════════════════════════════════════════════════ -->
    <section class="how" id="how">
      <div class="section-head">
        <span class="section-eyebrow">Processus</span>
        <h2>Comment ça fonctionne ?</h2>
        <p>De la recherche à l'emménagement, tout en quelques étapes simples.</p>
      </div>
      <div class="process-track">
        <div class="process-step">
          <div class="step-circle">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <div class="step-num">1</div>
          </div>
          <h3>Recherchez</h3>
          <p>Filtrez parmi des milliers d'annonces selon vos critères</p>
        </div>
        <div class="process-step">
          <div class="step-circle">
            <svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            <div class="step-num">2</div>
          </div>
          <h3>Visitez en ligne</h3>
          <p>Planifiez une visite virtuelle ou en personne</p>
        </div>
        <div class="process-step">
          <div class="step-circle">
            <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            <div class="step-num">3</div>
          </div>
          <h3>Postulez</h3>
          <p>Envoyez votre dossier complet en quelques clics</p>
        </div>
        <div class="process-step">
          <div class="step-circle">
            <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <div class="step-num">4</div>
          </div>
          <h3>Payez</h3>
          <p>Réglez votre loyer et votre caution en toute sécurité</p>
        </div>
        <div class="process-step">
          <div class="step-circle">
            <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21V12h6v9" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <div class="step-num">5</div>
          </div>
          <h3>Emménagez</h3>
          <p>Signez et gérez tout depuis l'application</p>
        </div>
      </div>
    </section>

    <!-- ══ LISTINGS placeholder ═══════════════════════════════ -->
    <div id="listings"></div>

    <!-- ══ TESTIMONIALS ═══════════════════════════════════════ -->
    <section class="testimonials" id="testimonials">
      <div class="section-head">
        <span class="section-eyebrow">Témoignages</span>
        <h2>Ce que disent nos étudiants</h2>
        <p>Des milliers d'étudiants ont trouvé leur logement grâce à Locavia</p>
      </div>
      <div class="testi-grid">

        <div class="testi-card">
          <span class="quote-mark">"</span>
          <div class="testi-stars">
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="testi-text">Locavia m'a permis de trouver une colocation parfaite en moins d'une semaine. Le processus est simple et rapide, je recommande vivement.</p>
          <div class="testi-author">
            <div class="testi-av" style="background:linear-gradient(135deg,#3E8A5A,#1C3D2A)">SM</div>
            <div>
              <div class="testi-name">Sami Mansour</div>
              <div class="testi-role">Étudiant · Lyon</div>
            </div>
          </div>
        </div>

        <div class="testi-card">
          <span class="quote-mark">"</span>
          <div class="testi-stars">
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="testi-text">La visite en ligne m'a vraiment convaincue. J'ai pu voir l'appartement depuis Tunis avant de signer mon contrat. Très pratique pour les étudiants à l'étranger.</p>
          <div class="testi-author">
            <div class="testi-av" style="background:linear-gradient(135deg,#C9A96E,#8A6A20)">AB</div>
            <div>
              <div class="testi-name">Amira Ben Ali</div>
              <div class="testi-role">Étudiante · Paris</div>
            </div>
          </div>
        </div>

        <div class="testi-card">
          <span class="quote-mark">"</span>
          <div class="testi-stars">
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg viewBox="0 0 24 24" style="opacity:.35"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="testi-text">La gestion des paiements est très pratique. Je règle mon loyer en quelques clics et je reçois des rappels automatiques. Parfait pour un étudiant.</p>
          <div class="testi-author">
            <div class="testi-av" style="background:linear-gradient(135deg,#5A8FC9,#2A4A8A)">KT</div>
            <div>
              <div class="testi-name">Karim Trabelsi</div>
              <div class="testi-role">Étudiant · Bordeaux</div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ══ CTA ════════════════════════════════════════════════ -->
    <div class="cta-wrap">
      <div class="cta-block">
        <div class="cta-ring r1"></div>
        <div class="cta-ring r2"></div>
        <span class="cta-label">Rejoignez Locavia</span>
        <h2>Prêt à trouver votre<br>logement idéal ?</h2>
        <p>Rejoignez des milliers d'étudiants qui ont déjà trouvé leur chez-soi grâce à Locavia.</p>
        <div class="cta-actions" (click)="$event.stopPropagation()">
          <a routerLink="/inscription" class="btn-white">Créer un compte gratuit</a>
          <a routerLink="/connexion"   class="btn-ghost-white">Se connecter</a>
        </div>
      </div>
    </div>

    <!-- ══ FOOTER ═════════════════════════════════════════════ -->
    <footer>
      <div class="footer-grid">
        <div class="footer-brand">
          <span class="footer-brand-name">Loca<span>via</span></span>
          <p>La plateforme de référence pour trouver un logement étudiant en Tunisie. Simple, rapide et sécurisé.</p>
        </div>
        <div class="footer-col">
          <h4>Services</h4>
          <a href="#">Location</a>
          <a href="#">Colocation</a>
          <a href="#">Visite en ligne</a>
          <a href="#">Marketplace</a>
        </div>
        <div class="footer-col">
          <h4>Compte</h4>
          <a href="#">Mes demandes</a>
          <a href="#">Mes paiements</a>
          <a href="#">Mon profil</a>
          <a href="#">Réclamations</a>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <a href="#">support&#64;locavia.tn</a>
          <a href="#">+216 71 000 000</a>
          <a href="#">FAQ</a>
          <a href="#">Blog</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2025 Locavia. Tous droits réservés.</span>
        <div class="footer-bottom-links">
          <a href="#">Mentions légales</a>
          <a href="#">Confidentialité</a>
          <a href="#">CGU</a>
        </div>
      </div>
    </footer>

  </div><!-- end page wrapper -->
  `
})
export class HomeComponent implements OnInit {

  // ── Auth wall state (same pattern as AccueilComponent) ──
  afficherMur   = false;
  murDejaMontré = false;

  // ── Navbar scroll state ──
  scrolled = false;

  // ── Services ──
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // If user is logged in, redirect to their dashboard
    if (this.authService.estConnecte()) {
      this.authService.redirigerSelonRole();
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 10;
  }

  @HostListener('document:keydown.escape')
  fermerMur(): void {
    this.afficherMur = false;
  }

  /**
   * Called on every click on the page wrapper.
   * Shows the auth wall exactly once per visit (same as accueil).
   */
  declencherMur(): void {
    if (!this.murDejaMontré) {
      this.afficherMur   = true;
      this.murDejaMontré = true;
    }
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}

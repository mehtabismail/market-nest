#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'marketnest-landing.html'), 'utf8');
const bodyMatch = html.match(/<body>([\s\S]*)<script>/);
if (!bodyMatch) throw new Error('Could not parse HTML body');
let body = bodyMatch[1].trim();

body = body
  .replace(/class=/g, 'className=')
  .replace(/<br>/g, '<br />')
  .replace(/className="stat"/g, 'className="hero-stat"')
  .replace(/className="stat-num"/g, 'className="hero-stat-num"')
  .replace(/className="stat-label"/g, 'className="hero-stat-label"')
  .replace(/<a href="#" className="nav-logo">/g, '<Link href="/" className="nav-logo">')
  .replace(/<a href="#" className="footer-logo">/g, '<Link href="/" className="footer-logo">')
  .replace(
    /<a href="#buyers" className="btn-primary">\s*<span>[^<]*<\/span>\s*Start Shopping<\/a>/,
    '<Link href="/shop" className="btn-primary"><Emoji>\uD83D\uDECD\uFE0F</Emoji> Start Shopping</Link>',
  )
  .replace(
    /<a href="#sell" className="btn-secondary">\s*<span>[^<]*<\/span>\s*Become a Seller<\/a>/,
    '<a href="#sell" className="btn-secondary"><Emoji>\uD83C\uDFEA</Emoji> Become a Seller</a>',
  )
  .replace(
    /<a href="#" className="panel-cta buyer-cta">Start Shopping \u2192<\/a>/,
    '<Link href="/shop" className="panel-cta buyer-cta">Start Shopping \u2192</Link>',
  )
  .replace(
    /<a href="#" className="btn-primary" style="background:var\(--teal\);">Apply to Sell \u2192<\/a>/,
    '<Link href="/seller/login" className="btn-primary" style={{ background: \'var(--teal)\' }}>Apply to Sell \u2192</Link>',
  )
  .replace(
    /<a href="#" className="btn-gold">[^<]*Start Shopping<\/a>/,
    '<Link href="/shop" className="btn-gold"><Emoji>\uD83D\uDECD\uFE0F</Emoji> Start Shopping</Link>',
  )
  .replace(/<!--[\s\S]*?-->/g, '');

body = body.replace(/style="([^"]+)"/g, (_, s) => {
  const obj = s
    .split(';')
    .filter(Boolean)
    .map((p) => {
      const idx = p.indexOf(':');
      const k = p.slice(0, idx).trim();
      const v = p.slice(idx + 1).trim();
      const key = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return `${key}: '${v}'`;
    })
    .join(', ');
  return `style={{ ${obj} }}`;
});

body = body.replace(/<div className="([^"]+)"><\/div>/g, '<div className="$1" />');

body = body.replace(
  /<div className="how-tabs">[\s\S]*?<div className="steps-panel active" id="buyer-steps">/,
  `<div className="how-tabs">
          <button type="button" className={\`tab-btn\${activeTab === 'buyer' ? ' active' : ''}\`} onClick={() => setActiveTab('buyer')}>For Buyers</button>
          <button type="button" className={\`tab-btn\${activeTab === 'seller' ? ' active' : ''}\`} onClick={() => setActiveTab('seller')}>For Sellers</button>
        </div>
        <div className="steps-container">
          <div className={\`steps-panel\${activeTab === 'buyer' ? ' active' : ''}\`} id="buyer-steps">`,
);

body = body.replace(
  /<div className="steps-panel" id="seller-steps">/,
  '<div className={`steps-panel${activeTab === \'seller\' ? \' active\' : \'\'}`} id="seller-steps">',
);

const revealTargets = [
  ['className="features-panel panel-buyer"', 'className="features-panel panel-buyer reveal reveal-delay-1"'],
  ['className="features-panel panel-seller"', 'className="features-panel panel-seller reveal reveal-delay-2"'],
  ['className="how-header"', 'className="how-header reveal"'],
  ['className="ai-visual"', 'className="ai-visual reveal reveal-delay-2"'],
  ['className="payments-header"', 'className="payments-header reveal"'],
  ['className="scta-visual"', 'className="scta-visual reveal"'],
  ['className="scta-content"', 'className="scta-content reveal reveal-delay-1"'],
  ['className="final-inner"', 'className="final-inner reveal"'],
];
for (const [from, to] of revealTargets) body = body.replace(from, to);

let n = 0;
body = body.replace(/className="feature-item buyer-feature"/g, () => `className="feature-item buyer-feature reveal reveal-delay-${Math.min(++n, 4)}"`);
n = 0;
body = body.replace(/className="feature-item seller-feature"/g, () => `className="feature-item seller-feature reveal reveal-delay-${Math.min(++n, 4)}"`);
n = 0;
body = body.replace(/className="step-card step-buyer"/g, () => `className="step-card step-buyer reveal reveal-delay-${++n}"`);
n = 0;
body = body.replace(/className="step-card step-seller"/g, () => `className="step-card step-seller reveal reveal-delay-${++n}"`);
n = 0;
body = body.replace(/className="payment-card"/g, () => `className="payment-card reveal reveal-delay-${++n}"`);
body = body.replace(/className="ai-feat"/g, 'className="ai-feat reveal"');
body = body.replace(/className="scta-metric"/g, 'className="scta-metric reveal"');
body = body.replace(/className="scta-order"/g, 'className="scta-order reveal"');
body = body.replace(/className="trust-badge"/g, 'className="trust-badge reveal"');

body = body.replace(
  /<Link href="\/" className="nav-logo">Market<span>Nest<\/span><\/a>/,
  '<Link href="/" className="nav-logo">Market<span>Nest</span></Link>',
);
body = body.replace(
  /<Link href="\/" className="footer-logo">Market<span>Nest<\/span><\/a>/,
  '<Link href="/" className="footer-logo">Market<span>Nest</span></Link>',
);

const header = `'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type TabType = 'buyer' | 'seller';

function Emoji({ children }: { children: string }) {
  return (
    <span className="landing-emoji" aria-hidden="true">
      {children}
    </span>
  );
}

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('buyer');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    root.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const selector = activeTab === 'buyer' ? '#buyer-steps .reveal' : '#seller-steps .reveal';
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    root.querySelectorAll(selector).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab]);

  return (
    <div className="landing-page" ref={rootRef}>
`;

const footer = `    </div>
  );
}
`;

const out = `${header}${body.split('\n').map((l) => `      ${l}`).join('\n')}\n${footer}`;
fs.writeFileSync(path.join(root, 'apps/web/src/components/landing/landing-page.tsx'), out, 'utf8');
console.log('Generated landing-page.tsx');

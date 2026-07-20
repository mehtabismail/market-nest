'use client';

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
      
      <nav>
        <Link href="/" className="nav-logo">Market<span>Nest</span></Link>
        <div className="nav-links">
          <a href="#buyers">For Buyers</a>
          <a href="#sellers">For Sellers</a>
          <a href="#how">How It Works</a>
          <a href="#ai">AI Features</a>
          <a href="#sell" className="nav-cta">Start Selling</a>
        </div>
      </nav>
      
      
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Now live — Pakistan's smartest marketplace
          </div>
          <h1>
            Buy Smart.<br />
            Sell <em>Smarter.</em>
          </h1>
          <p className="hero-sub">
            MarketNest is the multi-vendor marketplace where buyers discover anything they need and sellers grow their business — powered by AI-driven search, seamless payments, and real-time order tracking.
          </p>
          <div className="hero-actions">
            <a href="#buyers" className="btn-primary">
              <span>🛍️</span> Start Shopping
            </a>
            <a href="#sell" className="btn-secondary">
              <span>🏪</span> Become a Seller
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-num">1M<span>+</span></div>
              <div className="hero-stat-label">Users Supported</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num"><span>&lt;</span>1s</div>
              <div className="hero-stat-label">Page Load Speed</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">2</div>
              <div className="hero-stat-label">Payment Methods</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">24<span>/7</span></div>
              <div className="hero-stat-label">Live Order Tracking</div>
            </div>
          </div>
          <div className="hero-marquee">
            <div className="marquee-track">
              <div className="marquee-item">🔒 Secure Checkout</div>
              <div className="marquee-item">🤖 AI-Powered Search</div>
              <div className="marquee-item">📦 Real-Time Tracking</div>
              <div className="marquee-item">💳 Card & Cash on Delivery</div>
              <div className="marquee-item">⚡ Instant Listings</div>
              <div className="marquee-item">📊 Seller Analytics</div>
              <div className="marquee-item">🌍 Global CDN</div>
              <div className="marquee-item">🔒 Secure Checkout</div>
              <div className="marquee-item">🤖 AI-Powered Search</div>
              <div className="marquee-item">📦 Real-Time Tracking</div>
              <div className="marquee-item">💳 Card & Cash on Delivery</div>
              <div className="marquee-item">⚡ Instant Listings</div>
              <div className="marquee-item">📊 Seller Analytics</div>
              <div className="marquee-item">🌍 Global CDN</div>
            </div>
          </div>
        </div>
      </section>
      
      
      <section id="buyers" style={{ padding: '100px 5%' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
          <p className="section-label">Platform Overview</p>
          <h2 className="section-title">Built for everyone.<br />Optimised for you.</h2>
          <p className="section-sub">Whether you're looking to find the perfect product or grow a thriving online store, MarketNest gives you everything you need in one place.</p>
        </div>
        <div className="features-grid" id="sellers">
          
          <div className="features-panel panel-buyer reveal reveal-delay-1">
            <div className="panel-header">
              <span className="panel-tag buyer-tag">🛍️ For Buyers</span>
              <h3 className="panel-title">Shop without limits. Track everything.</h3>
              <p className="panel-desc">Browse thousands of products, add to cart without logging in, and pay however you prefer. Real-time updates keep you informed at every step.</p>
            </div>
            <ul className="feature-list">
              <li className="feature-item buyer-feature reveal reveal-delay-1">
                <div className="fi-icon buyer-icon">🧭</div>
                <div className="fi-text">
                  <div className="fi-title">Browse as a guest</div>
                  <div className="fi-desc">No account required to explore or add to cart. Your cart stays saved for 7 days automatically.</div>
                </div>
              </li>
              <li className="feature-item buyer-feature reveal reveal-delay-2">
                <div className="fi-icon buyer-icon">🤖</div>
                <div className="fi-text">
                  <div className="fi-title">AI-Powered Search</div>
                  <div className="fi-desc">Type exactly what you want in plain language. Find "blue summer dress" even if it's listed as "azure frock".</div>
                </div>
              </li>
              <li className="feature-item buyer-feature reveal reveal-delay-3">
                <div className="fi-icon buyer-icon">💳</div>
                <div className="fi-text">
                  <div className="fi-title">Pay your way</div>
                  <div className="fi-desc">Secure online card payments via Stripe, or Cash on Delivery — your choice at checkout, every time.</div>
                </div>
              </li>
              <li className="feature-item buyer-feature reveal reveal-delay-4">
                <div className="fi-icon buyer-icon">📡</div>
                <div className="fi-text">
                  <div className="fi-title">Live order tracking</div>
                  <div className="fi-desc">Watch your order status update in real time. Get email & SMS notifications at every stage.</div>
                </div>
              </li>
              <li className="feature-item buyer-feature reveal reveal-delay-4">
                <div className="fi-icon buyer-icon">⭐</div>
                <div className="fi-text">
                  <div className="fi-title">Verified reviews</div>
                  <div className="fi-desc">Only real, verified purchasers can leave reviews. Trust what you read — every time.</div>
                </div>
              </li>
            </ul>
            <Link href="/shop" className="panel-cta buyer-cta">Start Shopping →</Link>
          </div>
          
          <div className="features-panel panel-seller reveal reveal-delay-2">
            <div className="panel-header">
              <span className="panel-tag seller-tag">🏪 For Sellers</span>
              <h3 className="panel-title">Your store. Your products. Your earnings.</h3>
              <p className="panel-desc">Get invited, set up your store, and start selling in minutes. Manage your full catalogue, track every order, and receive weekly payouts — all in one dashboard.</p>
            </div>
            <ul className="feature-list">
              <li className="feature-item seller-feature reveal reveal-delay-1">
                <div className="fi-icon seller-icon">📦</div>
                <div className="fi-text">
                  <div className="fi-title">Full product management</div>
                  <div className="fi-desc">Add products with rich descriptions, up to 10 images, variants (size/colour), and manage stock — all live within 60 seconds.</div>
                </div>
              </li>
              <li className="feature-item seller-feature reveal reveal-delay-2">
                <div className="fi-icon seller-icon">🗂️</div>
                <div className="fi-text">
                  <div className="fi-title">Order dashboard</div>
                  <div className="fi-desc">View, process, and update every order in your queue. From confirmed to delivered — all in one place.</div>
                </div>
              </li>
              <li className="feature-item seller-feature reveal reveal-delay-3">
                <div className="fi-icon seller-icon">💰</div>
                <div className="fi-text">
                  <div className="fi-title">Transparent earnings & payouts</div>
                  <div className="fi-desc">See gross sales, platform commission, and net earnings clearly. Weekly payouts direct to your account.</div>
                </div>
              </li>
              <li className="feature-item seller-feature reveal reveal-delay-4">
                <div className="fi-icon seller-icon">🔐</div>
                <div className="fi-text">
                  <div className="fi-title">Complete data isolation</div>
                  <div className="fi-desc">Your catalogue, orders, and earnings are yours alone. Other sellers can never see your data — guaranteed by database-level security.</div>
                </div>
              </li>
              <li className="feature-item seller-feature reveal reveal-delay-4">
                <div className="fi-icon seller-icon">🤖</div>
                <div className="fi-text">
                  <div className="fi-title">AI description writer (coming soon)</div>
                  <div className="fi-desc">Type a few keywords and let AI generate a compelling product description for you in seconds.</div>
                </div>
              </li>
            </ul>
            <a href="#sell" className="panel-cta seller-cta">Apply to Sell →</a>
          </div>
        </div>
      </section>
      
      
      <section className="how-section" id="how">
        <div className="how-header reveal">
          <p className="section-label">Simple Process</p>
          <h2 className="section-title">Up and running in minutes</h2>
          <p className="section-sub">Whether buying or selling, getting started on MarketNest takes no time at all.</p>
        </div>
        <div className="how-tabs">
                <button type="button" className={`tab-btn${activeTab === 'buyer' ? ' active' : ''}`} onClick={() => setActiveTab('buyer')}>For Buyers</button>
                <button type="button" className={`tab-btn${activeTab === 'seller' ? ' active' : ''}`} onClick={() => setActiveTab('seller')}>For Sellers</button>
              </div>
              <div className="steps-container">
                <div className={`steps-panel${activeTab === 'buyer' ? ' active' : ''}`} id="buyer-steps">
            <div className="step-card step-buyer reveal reveal-delay-1">
              <div className="step-accent" />
              <div className="step-number">01</div>
              <div className="step-icon">🌐</div>
              <div className="step-title">Browse freely</div>
              <div className="step-desc">Explore thousands of products across all categories — no account needed. Your cart is automatically saved for 7 days.</div>
            </div>
            <div className="step-card step-buyer reveal reveal-delay-2">
              <div className="step-accent" />
              <div className="step-number">02</div>
              <div className="step-icon">🛒</div>
              <div className="step-title">Add to cart</div>
              <div className="step-desc">Add any product instantly. Mix items from different listings, adjust quantities, and check your running total at any time.</div>
            </div>
            <div className="step-card step-buyer reveal reveal-delay-3">
              <div className="step-accent" />
              <div className="step-number">03</div>
              <div className="step-icon">🔑</div>
              <div className="step-title">Sign in at checkout</div>
              <div className="step-desc">One-click Google sign-in or email — only required at checkout. Your cart merges seamlessly into your new account.</div>
            </div>
            <div className="step-card step-buyer reveal reveal-delay-4">
              <div className="step-accent" />
              <div className="step-number">04</div>
              <div className="step-icon">📡</div>
              <div className="step-title">Track in real time</div>
              <div className="step-desc">Get email and SMS updates as your order moves from confirmed → processing → shipped → delivered.</div>
            </div>
          </div>
          <div className={`steps-panel${activeTab === 'seller' ? ' active' : ''}`} id="seller-steps">
            <div className="step-card step-seller reveal reveal-delay-1">
              <div className="step-accent" />
              <div className="step-number">01</div>
              <div className="step-icon">📩</div>
              <div className="step-title">Receive your invite</div>
              <div className="step-desc">Our team reviews your application and sends a secure email invite with a 48-hour setup link to get you started.</div>
            </div>
            <div className="step-card step-seller reveal reveal-delay-2">
              <div className="step-accent" />
              <div className="step-number">02</div>
              <div className="step-icon">🏪</div>
              <div className="step-title">Set up your store</div>
              <div className="step-desc">Complete your store profile — name, description, and logo. Your unique store URL is auto-generated and ready to go.</div>
            </div>
            <div className="step-card step-seller reveal reveal-delay-3">
              <div className="step-accent" />
              <div className="step-number">03</div>
              <div className="step-icon">📦</div>
              <div className="step-title">List your products</div>
              <div className="step-desc">Add products with drag-and-drop images, variants, pricing, and stock. Published listings go live on the storefront in under 60 seconds.</div>
            </div>
            <div className="step-card step-seller reveal reveal-delay-4">
              <div className="step-accent" />
              <div className="step-number">04</div>
              <div className="step-icon">💰</div>
              <div className="step-title">Get paid weekly</div>
              <div className="step-desc">Process orders from your dashboard and receive weekly payouts with a clear breakdown of sales, commission, and net earnings.</div>
            </div>
          </div>
        </div>
      </section>
      
      
      <section className="ai-section" id="ai">
        <div className="ai-bg" />
        <div className="ai-inner">
          <div>
            <p className="section-label">AI-Powered Platform</p>
            <h2 className="section-title">Intelligence built into every search</h2>
            <p className="section-sub">MarketNest uses advanced AI to help buyers find exactly what they need — and helps sellers be discovered more easily.</p>
            <div className="ai-features">
              <div className="ai-feat reveal">
                <div className="ai-feat-icon">🧠</div>
                <div>
                  <div className="ai-feat-title">Semantic Search</div>
                  <div className="ai-feat-desc">Understands meaning, not just keywords. Find "lightweight summer top" even when the listing says "breathable cotton blouse".</div>
                </div>
              </div>
              <div className="ai-feat reveal">
                <div className="ai-feat-icon">✨</div>
                <div>
                  <div className="ai-feat-title">Personalised Recommendations</div>
                  <div className="ai-feat-desc">The more you shop, the smarter your homepage gets. Products curated just for you, updated daily.</div>
                </div>
              </div>
              <div className="ai-feat reveal">
                <div className="ai-feat-icon">💬</div>
                <div>
                  <div className="ai-feat-title">AI Shopping Assistant</div>
                  <div className="ai-feat-desc">Describe what you need in plain English. Our AI finds the best matching products and presents them as clickable cards — instantly.</div>
                </div>
              </div>
            </div>
          </div>
          <div className="ai-visual reveal reveal-delay-2">
            <div className="chat-label">AI Shopping Assistant</div>
            <div className="chat-window">
              <div className="chat-msg chat-user">I need a gift under Rs 5,000 for my mum who loves gardening 🌿</div>
              <div className="chat-ai">
                <div style={{ marginBottom: '10px' }}>I found some lovely options she'd adore! Here are my top picks:</div>
                <div className="chat-products">
                  <div className="chat-product">
                    <div className="chat-product-emoji">🌱</div>
                    <div className="chat-product-name">Herb Growing Kit</div>
                    <div className="chat-product-price">Rs 1,850</div>
                  </div>
                  <div className="chat-product">
                    <div className="chat-product-emoji">🧤</div>
                    <div className="chat-product-name">Garden Glove Set</div>
                    <div className="chat-product-price">Rs 2,200</div>
                  </div>
                  <div className="chat-product">
                    <div className="chat-product-emoji">🪴</div>
                    <div className="chat-product-name">Terracotta Pot Set</div>
                    <div className="chat-product-price">Rs 3,400</div>
                  </div>
                  <div className="chat-product">
                    <div className="chat-product-emoji">✂️</div>
                    <div className="chat-product-name">Pruning Shears</div>
                    <div className="chat-product-price">Rs 4,750</div>
                  </div>
                </div>
              </div>
              <div className="ai-typing">
                <div className="ai-dot" />
                <div className="ai-dot" />
                <div className="ai-dot" />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      
      <section className="payments-section">
        <div className="payments-inner">
          <div className="payments-header reveal">
            <p className="section-label">Payments</p>
            <h2 className="section-title">Pay the way you trust</h2>
            <p className="section-sub">Two secure payment options at checkout. No surprises, no redirects — just a smooth, protected transaction every time.</p>
          </div>
          <div className="payment-cards">
            <div className="payment-card reveal reveal-delay-1">
              <div className="payment-card-icon">💳</div>
              <div className="payment-card-title">Online Card Payment</div>
              <div className="payment-card-desc">Powered by Stripe — the world's most trusted payment infrastructure. Enter your card details directly on-page with no redirect. Apple Pay and Google Pay supported on compatible devices.</div>
              <div className="payment-highlights">
                <span className="ph-tag">Stripe Secured</span>
                <span className="ph-tag">Apple Pay</span>
                <span className="ph-tag">Google Pay</span>
                <span className="ph-tag">Instant Confirmation</span>
              </div>
            </div>
            <div className="payment-card reveal reveal-delay-2">
              <div className="payment-card-icon">🏠</div>
              <div className="payment-card-title">Cash on Delivery</div>
              <div className="payment-card-desc">Prefer to pay when your order arrives? Choose COD at checkout. Your order is confirmed immediately and the seller is notified right away. Cancel any time before dispatch — no charge, no hassle.</div>
              <div className="payment-highlights">
                <span className="ph-tag">Pay on Arrival</span>
                <span className="ph-tag">Free Cancellation</span>
                <span className="ph-tag">Instant Confirmation</span>
              </div>
            </div>
            <div className="payment-card reveal reveal-delay-3">
              <div className="payment-card-icon">🔐</div>
              <div className="payment-card-title">Always Protected</div>
              <div className="payment-card-desc">Every transaction is protected. Failed payments are clearly explained with instant retry. Refunds for online payments are initiated within 5 minutes and typically arrive in 3–5 business days.</div>
              <div className="payment-highlights">
                <span className="ph-tag">5-min Refund Init</span>
                <span className="ph-tag">Dispute Resolution</span>
                <span className="ph-tag">Encrypted End-to-End</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      
      <section className="seller-cta-section" id="sell">
        <div className="scta-inner">
          <div className="scta-visual reveal">
            <div className="scta-dashboard">
              <div className="scta-row">
                <div className="scta-metric reveal">
                  <div className="scta-metric-label">Net Earnings (Month)</div>
                  <div className="scta-metric-val">Rs 84,<span>320</span></div>
                </div>
                <div className="scta-metric reveal">
                  <div className="scta-metric-label">Orders This Week</div>
                  <div className="scta-metric-val"><span>47</span></div>
                </div>
              </div>
              <div className="scta-chart">
                <div className="scta-bar" style={{ height: '35%' }}></div>
                <div className="scta-bar" style={{ height: '50%' }}></div>
                <div className="scta-bar" style={{ height: '42%' }}></div>
                <div className="scta-bar active" style={{ height: '65%' }}></div>
                <div className="scta-bar" style={{ height: '58%' }}></div>
                <div className="scta-bar active" style={{ height: '80%' }}></div>
                <div className="scta-bar" style={{ height: '70%' }}></div>
                <div className="scta-bar active" style={{ height: '90%' }}></div>
                <div className="scta-bar" style={{ height: '75%' }}></div>
                <div className="scta-bar active" style={{ height: '100%' }}></div>
              </div>
              <div className="scta-order reveal">
                <div className="scta-order-dot" style={{ background: 'var(--teal)' }}></div>
                <div className="scta-order-info">
                  <div className="scta-order-title">Order #MN-8841 — Shipped</div>
                  <div className="scta-order-sub">2 items · Lahore · COD</div>
                </div>
                <div className="scta-order-val">Rs 3,200</div>
              </div>
              <div className="scta-order reveal">
                <div className="scta-order-dot" style={{ background: 'var(--gold)' }}></div>
                <div className="scta-order-info">
                  <div className="scta-order-title">Order #MN-8842 — Processing</div>
                  <div className="scta-order-sub">1 item · Karachi · Online</div>
                </div>
                <div className="scta-order-val">Rs 1,800</div>
              </div>
              <div className="scta-order reveal">
                <div className="scta-order-dot" style={{ background: 'var(--accent)' }}></div>
                <div className="scta-order-info">
                  <div className="scta-order-title">Order #MN-8843 — New</div>
                  <div className="scta-order-sub">3 items · Islamabad · Online</div>
                </div>
                <div className="scta-order-val">Rs 5,600</div>
              </div>
            </div>
          </div>
          <div className="scta-content reveal reveal-delay-1">
            <p className="section-label">Become a Seller</p>
            <h2 className="section-title">Your store on Pakistan's most capable platform</h2>
            <p className="section-sub" style={{ maxWidth: '100%' }}>MarketNest gives you a complete toolkit to sell online — without the complexity. From your first listing to your hundredth order, we handle the infrastructure so you can focus on your products.</p>
            <ul className="scta-points">
              <li className="scta-point">
                <div className="scta-point-icon">✓</div>
                Manage products, variants, stock and images in one dashboard
              </li>
              <li className="scta-point">
                <div className="scta-point-icon">✓</div>
                Receive real-time order notifications — never miss a sale
              </li>
              <li className="scta-point">
                <div className="scta-point-icon">✓</div>
                Weekly payouts with full earnings breakdown and payout history
              </li>
              <li className="scta-point">
                <div className="scta-point-icon">✓</div>
                Your data is 100% private — isolated from every other seller
              </li>
              <li className="scta-point">
                <div className="scta-point-icon">✓</div>
                AI-powered embeddings mean your products get discovered instantly
              </li>
              <li className="scta-point">
                <div className="scta-point-icon">✓</div>
                Full payout history downloadable as CSV or PDF at any time
              </li>
            </ul>
            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/seller/login" className="btn-primary" style={{ background: 'var(--teal)' }}>Apply to Sell →</Link>
              <a href="#how" className="btn-secondary">See how it works</a>
            </div>
          </div>
        </div>
      </section>
      
      
      <section className="trust-section">
        <div className="trust-inner">
          <div className="trust-title">Built on industry-standard infrastructure</div>
          <div className="trust-badges">
            <div className="trust-badge reveal">⚡ Vercel Global CDN</div>
            <div className="trust-badge reveal">🔒 Stripe Payments</div>
            <div className="trust-badge reveal">🛡️ Supabase Row-Level Security</div>
            <div className="trust-badge reveal">📡 Real-Time Updates</div>
            <div className="trust-badge reveal">🤖 OpenAI Embeddings</div>
            <div className="trust-badge reveal">📱 SMS via Twilio</div>
            <div className="trust-badge reveal">☁️ Auto-Scaling Infrastructure</div>
          </div>
        </div>
      </section>
      
      
      <section className="final-cta">
        <div className="final-bg" />
        <div className="final-inner reveal">
          <p className="section-label">Get Started Today</p>
          <h2>Ready to join<br />MarketNest?</h2>
          <p>Thousands of products. Seamless checkout. Weekly seller payouts. A smarter marketplace experience starts here.</p>
          <div className="final-cta-actions">
            <Link href="/shop" className="btn-gold"><Emoji>🛍️</Emoji> Start Shopping</Link>
            <a href="#sell" className="btn-ghost">🏪 Apply as a Seller</a>
          </div>
        </div>
      </section>
      
      
      <footer>
        <div className="footer-inner">
          <Link href="/" className="footer-logo">Market<span>Nest</span></Link>
          <div className="footer-links">
            <a href="#buyers">For Buyers</a>
            <a href="#sellers">For Sellers</a>
            <a href="#how">How It Works</a>
            <a href="#ai">AI Features</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
        </div>
        <div className="footer-copy">© 2026 MarketNest. All rights reserved. Built for Pakistan, scaled for the world.</div>
      </footer>
    </div>
  );
}

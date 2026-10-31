import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll(sel)) as T[];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------
   Smooth scrolling (Lenis) wired into GSAP's ticker
   ------------------------------------------------------------------ */
let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

$$<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href') ?? '';
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target as HTMLElement, { duration: 1.6 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

const nav = $('[data-nav]');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ------------------------------------------------------------------
   Laptop screen: live app iframe, scaled to fit, click-to-interact
   ------------------------------------------------------------------ */
const APP_WIDTH = 1280;
const screen = $('[data-screen]');
const frame = $<HTMLIFrameElement>('[data-app-frame]');
const shield = $<HTMLButtonElement>('[data-shield]');

function sizeFrame() {
  const s = screen.offsetWidth / APP_WIDTH;
  screen.style.setProperty('--s', String(s));
  screen.style.setProperty('--ih', String(Math.ceil(screen.offsetHeight / s)));
}
sizeFrame();

const markLoaded = () => {
  screen.classList.add('is-loaded');
  ScrollTrigger.refresh();
};
frame.addEventListener('load', markLoaded);
// The iframe may finish loading before this module runs.
try {
  const doc = frame.contentDocument;
  if (doc && doc.readyState === 'complete' && doc.location.pathname.startsWith('/app')) markLoaded();
} catch {
  /* ignore */
}

let leaveTimer = 0;
shield.addEventListener('click', () => {
  // On touch screens the scaled-down app is too small to use; open it full size instead.
  if (window.matchMedia('(pointer: coarse)').matches) {
    window.location.href = '/app/';
    return;
  }
  screen.classList.add('is-live');
  frame.setAttribute('tabindex', '0');
  frame.focus();
});
screen.addEventListener('mouseenter', () => window.clearTimeout(leaveTimer));
screen.addEventListener('mouseleave', () => {
  leaveTimer = window.setTimeout(() => {
    screen.classList.remove('is-live');
    frame.setAttribute('tabindex', '-1');
  }, 700);
});

// Switch the live app's sidebar tab to match the feature being described.
// Same-origin iframe; silently skipped if the app isn't ready or the user is driving it.
function showAppTab(label: string) {
  if (screen.classList.contains('is-live')) return;
  try {
    const nav = frame.contentDocument?.querySelector('nav[aria-label="Main"]');
    const btn = Array.from(nav?.querySelectorAll('button') ?? []).find((b) =>
      (b.textContent ?? '').trim().toLowerCase().startsWith(label.toLowerCase())
    );
    btn?.click();
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------
   Feature chips + app tab per feature section
   ------------------------------------------------------------------ */
const chipsets = $$('[data-chipset]');
function setFeature(id: string | null) {
  chipsets.forEach((c) => c.classList.toggle('is-active', c.dataset.chipset === id));
}

const featureSections = $$('[data-feature]');
featureSections.forEach((section, i) => {
  ScrollTrigger.create({
    trigger: section,
    start: 'top 55%',
    end: 'bottom 45%',
    onToggle: (self) => {
      if (!self.isActive) return;
      setFeature(section.dataset.feature ?? null);
      showAppTab(section.dataset.tab ?? 'Dashboard');
    },
    // Clear chips when scrolling past the last feature or back above the first
    onLeave: () => i === featureSections.length - 1 && setFeature(null),
    onLeaveBack: () => i === 0 && setFeature(null)
  });
});

/* ------------------------------------------------------------------
   Phone preview: tabs, UPI collect, assistant
   ------------------------------------------------------------------ */
const phone = $('[data-phone]');
const phoneScreen = $('[data-phone-screen]');
const qrPanel = $('[data-qr-panel]');
const chat = $('[data-chat]');

function setPhoneView(view: string, opts: { qr?: boolean } = {}) {
  phoneScreen.dataset.view = view;
  $$('.ps__tabs button', phoneScreen).forEach((b) => b.classList.toggle('is-active', b.dataset.go === view));
  qrPanel.hidden = !(view === 'bill' && opts.qr);
}

const answers: Record<string, { q: string; a: string; cites: string[] }> = {
  sales: {
    q: 'How much did I sell this month?',
    a: 'October sales are <b>₹14,82,600</b> across 63 invoices — 18% above September.',
    cites: ['Sales register', 'Oct 2026']
  },
  gst: {
    q: 'How much GST liability do I have?',
    a: 'Output GST this month is <b>₹82,700</b>: CGST ₹31,420 + SGST ₹31,420 + IGST ₹19,860.',
    cites: ['GSTR-1 Table 12']
  },
  stock: {
    q: 'Which items are running low?',
    a: '<b>3 items</b> are below reorder level: Cat6 Cable 305m box, TP-Link Archer C6, Logitech MK270.',
    cites: ['Items & stock']
  }
};

phone.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('button');
  if (!t) return;
  if (t.dataset.go) setPhoneView(t.dataset.go, { qr: t.hasAttribute('data-qr') });
  if (t.hasAttribute('data-qr-toggle')) qrPanel.hidden = !qrPanel.hidden;
  if (t.hasAttribute('data-paid')) {
    t.classList.add('is-done');
    t.textContent = 'Paid ✓ · Receipt ready';
  }
  const key = t.dataset.ask;
  if (key && answers[key]) {
    const { q, a, cites } = answers[key];
    const me = document.createElement('p');
    me.className = 'ps__bubble ps__bubble--me';
    me.textContent = q;
    const ai = document.createElement('div');
    ai.className = 'ps__bubble ps__bubble--ai';
    ai.innerHTML = `${a}<span class="ps__cites">${cites.map((c) => `<a>${c}</a>`).join('')}</span>`;
    chat.append(me);
    window.setTimeout(() => {
      chat.append(ai);
      ai.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 450);
    me.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
});
$$('.ps__view').forEach((v) => v.setAttribute('data-lenis-prevent', ''));

$$('[data-go-phone]').forEach((b) =>
  b.addEventListener('click', () => setPhoneView(b.dataset.goPhone ?? 'home', { qr: b.dataset.goPhone === 'bill' }))
);

$$('[data-mobile]').forEach((section) => {
  ScrollTrigger.create({
    trigger: section,
    start: 'top 55%',
    end: 'bottom 45%',
    onToggle: (self) => self.isActive && setPhoneView(section.dataset.mobile ?? 'home')
  });
});

/* ------------------------------------------------------------------
   Intro reveal
   ------------------------------------------------------------------ */
const laptop = $('[data-laptop]');
const lid = $('[data-lid]');

if (!reduceMotion) {
  gsap.from('.reveal-hero', { y: 28, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.09, delay: 0.1 });
  gsap.fromTo(lid, { rotationX: -88 }, { rotationX: 6, duration: 2, ease: 'power3.inOut', delay: 0.35 });
  gsap.from(nav, { y: -30, autoAlpha: 0, duration: 0.9, ease: 'power3.out' });
} else {
  gsap.set(lid, { rotationX: 6 });
}

$$('.reveal').forEach((el) => {
  if (reduceMotion) return;
  gsap.from(el, {
    y: 40,
    autoAlpha: 0,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
  });
});

/* ------------------------------------------------------------------
   Responsive choreography
   ------------------------------------------------------------------ */
const story = $('[data-story]');
const stack = $('[data-stack]');
const phoneSlot = $('[data-phone-slot]');
const scene = $('[data-scene]');
const cue = $('[data-cue]');

const vw = () => window.innerWidth;
const vh = () => window.innerHeight;
// Laptop is designed at 1000×625 (+ base); fit it to the viewport.
const heroFit = () => Math.min(0.86, (vw() * 0.62) / 1000, (vh() * 0.95) / 760);
const phoneFit = () => Math.min(1, (vh() * 0.72) / 618);

function setStaticFit() {
  document.documentElement.style.setProperty('--fit', String(Math.min(1, (vw() - 32) / 1000)));
  document.documentElement.style.setProperty('--pfit', String(Math.min(1, (vw() * 0.78) / 300)));
}
setStaticFit();
window.addEventListener('resize', () => {
  setStaticFit();
  sizeFrame();
});

const mm = gsap.matchMedia();

mm.add(
  {
    desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    compact: '(max-width: 1023px), (prefers-reduced-motion: reduce)'
  },
  (ctx) => {
    const { desktop } = ctx.conditions as { desktop: boolean; compact: boolean };

    if (!desktop) {
      // Static flow: phone sits inline in the mobile section.
      phoneSlot.append(phone);
      $$('.feature__card, .stack__card').forEach((card) => {
        if (reduceMotion) return;
        gsap.from(card, { y: 40, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 85%', once: true } });
      });
      return () => scene.append(phone);
    }

    // Poses (functions so they re-evaluate on resize via invalidateOnRefresh)
    const heroPose = {
      x: 0,
      y: () => Math.max(vh() * 0.4, 560 - vh() * 0.5 + 312 * heroFit()),
      scale: () => heroFit(),
      rotationX: -14,
      rotationY: 0,
      rotationZ: 0
    };
    // Keep the rotated laptop (lid + base) inside the right half of the viewport
    const featureFit = () => Math.min(heroFit() * 0.74, (vw() * 0.4) / 1000, (vh() * 0.72) / 1000);
    const featurePose = {
      x: () => vw() * 0.255,
      y: () => -vh() * 0.02,
      scale: () => featureFit(),
      rotationX: -10,
      rotationY: -24,
      rotationZ: 0
    };
    const parkedPose = {
      x: () => -vw() * 0.3,
      y: () => vh() * 0.28,
      scale: () => featureFit() * 0.68,
      rotationX: -62,
      rotationY: -16,
      rotationZ: 4
    };

    gsap.set(laptop, heroPose);
    gsap.set(phone, { autoAlpha: 0 });

    // 1. Hero → laptop glides right, turns towards the copy
    gsap
      .timeline({
        scrollTrigger: {
          trigger: story,
          start: 'top top',
          end: () => `+=${vh() * 0.85}`,
          scrub: 0.6,
          invalidateOnRefresh: true
        }
      })
      .fromTo(laptop, heroPose, { ...featurePose, ease: 'power1.inOut' }, 0)
      .to(cue, { autoAlpha: 0, duration: 0.2 }, 0);

    // 2. Feature copy fades in and out as each block passes the pinned laptop
    $$('[data-feature] .feature__card, [data-mobile] .feature__card, .stack__card').forEach((card) => {
      gsap
        .timeline({
          scrollTrigger: { trigger: card.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
        })
        .fromTo(card, { y: 90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.32, ease: 'power2.out' })
        .to(card, { y: 0, duration: 0.36 })
        .to(card, { y: -70, autoAlpha: 0, duration: 0.32, ease: 'power2.in' });
    });

    // 3. Lid closes, laptop parks bottom-left, phone rises and stacks in front of it
    gsap
      .timeline({
        scrollTrigger: {
          trigger: stack,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: 0.8,
          invalidateOnRefresh: true
        }
      })
      .fromTo('.chips', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08, immediateRender: false }, 0)
      .fromTo(lid, { rotationX: 6 }, { rotationX: -88, duration: 0.42, ease: 'power2.inOut', immediateRender: false }, 0.02)
      .fromTo(laptop, featurePose, { ...parkedPose, duration: 0.55, ease: 'power2.inOut', immediateRender: false }, 0.3)
      .fromTo(
        phone,
        { autoAlpha: 0, x: () => -vw() * 0.15, y: () => vh() * 0.9, z: 160, scale: () => phoneFit(), rotationX: 34, rotationY: -40, rotationZ: -10 },
        {
          autoAlpha: 1,
          x: () => -vw() * 0.15,
          y: () => vh() * 0.03,
          z: 160,
          scale: () => phoneFit(),
          rotationX: 6,
          rotationY: 24,
          rotationZ: -3,
          duration: 0.5,
          ease: 'power3.out',
          immediateRender: false
        },
        0.5
      );
  }
);

document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());

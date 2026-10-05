/*
* ----------------------------------------------------------------------------------------
Author        : Awad Alqarni
Template Name : awadalqarni - personal portfolio
Version       : 2.0
Description   : Routing, rendering of the database content and all page animation.
                No dependencies — data comes from window.SiteData (javascript/resume-db.js).
* ----------------------------------------------------------------------------------------
*/
(() => {
    'use strict';

    // =====================================================================
    // Helpers
    // =====================================================================
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pad = n => String(n).padStart(2, '0');
    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const splitList = s => String(s ?? '').split(',').map(t => t.trim()).filter(Boolean);

    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

    const ROUTES = { home: 'Home', work: 'Work', resume: 'Resume', blog: 'Blog' };
    // Old section hashes keep working
    const LEGACY = { herosection: 'home', productspage: 'work', resumepage: 'resume', blogpage: 'blog' };
    const EASE_IO = 'cubic-bezier(.76, 0, .24, 1)';
    const EASE_OUT = 'cubic-bezier(.16, 1, .3, 1)';

    const ICON_ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>';
    const ICON_PIN = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

    const header = $('.site-header');
    const nav = $('.nav');
    const menuToggle = $('.menu-toggle');
    const dialog = $('#project');

    let works = [];
    let currentRoute = null;
    let siteReady = false;
    let menuOpen = false;

    // Only allow safe link / image targets coming from the database
    function safeUrl(url) {
        const u = String(url ?? '').trim();
        if (!u) return '';
        if (/^data:image\//i.test(u) || /^(https?:|mailto:)/i.test(u)) return u;
        if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ''; // javascript:, file:, …
        return u; // relative path
    }

    function placeholderCover(title) {
        const letters = String(title || '?').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c1c21"/><stop offset="1" stop-color="#3a1a08"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="400" y="330" text-anchor="middle" dominant-baseline="middle" font-family="Space Grotesk, Arial, sans-serif" font-size="200" font-weight="700" fill="#ff5e15">${esc(letters)}</text></svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    const coverOf = w => safeUrl(w.image) || placeholderCover(w.title);

    function paragraphs(text) {
        return String(text ?? '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
            .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
    }

    // =====================================================================
    // Text splitting & reveal on scroll
    // =====================================================================
    function splitText(el) {
        if (el.dataset.splitDone) return;
        el.dataset.splitDone = '1';
        el.classList.add('split');
        const byChar = el.dataset.split === 'chars';
        let i = 0;
        const makeInner = text => {
            const span = document.createElement('span');
            span.className = 'wi';
            span.style.setProperty('--i', i++);
            span.textContent = text;
            return span;
        };
        const walk = node => {
            [...node.childNodes].forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                        const word = document.createElement('span');
                        word.className = 'w';
                        if (byChar) [...part].forEach(ch => word.appendChild(makeInner(ch)));
                        else word.appendChild(makeInner(part));
                        frag.appendChild(word);
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === Node.ELEMENT_NODE && !child.matches('svg, img, .circle')) {
                    walk(child);
                }
            });
        };
        walk(el);
    }

    const revealObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                reveal(entry.target);
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 })
        : null;

    function reveal(el) {
        el.classList.add('in');
        (el.matches('[data-count]') ? [el] : $$('[data-count]', el)).forEach(countUp);
    }

    function observe(root) {
        if (!root) return;
        $$('[data-reveal]', root).forEach(el => {
            if (el.dataset.reveal === 'split') splitText(el);
            if (el.classList.contains('in')) return;
            if (revealObserver) revealObserver.observe(el);
            else reveal(el);
        });
    }

    // Hidden views replay their animation the next time they are shown
    function resetReveals(root) {
        $$('[data-reveal]', root).forEach(el => {
            el.classList.remove('in');
            revealObserver?.unobserve(el);
        });
    }

    function countUp(el) {
        const target = Number(el.dataset.count) || 0;
        if (reduceMotion || target === 0) { el.textContent = target; return; }
        const duration = 1600;
        const start = performance.now();
        const tick = now => {
            const t = clamp((now - start) / duration, 0, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4)));
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    // =====================================================================
    // Router & page transitions
    // =====================================================================
    function parseHash() {
        const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
        const [head, sub] = raw.split('/');
        if (LEGACY[head]) history.replaceState(null, '', '#' + LEGACY[head]);
        return { route: ROUTES[head] ? head : (LEGACY[head] || 'home'), sub: sub || null };
    }

    let navQueue = Promise.resolve();
    function queueRoute(animate) {
        navQueue = navQueue.then(() => handleRoute(animate)).catch(err => console.error(err));
    }

    async function handleRoute(animate) {
        const { route, sub } = parseHash();
        const projectId = route === 'work' && sub ? sub : null;
        if (!projectId && project.isOpen) closeProject({ fromRouter: true });
        if (route !== currentRoute) await showView(route, animate);
        if (projectId) {
            await dataReady.catch(() => null);
            openProject(projectId);
        }
    }

    async function showView(route, animate) {
        const withCurtain = animate && currentRoute !== null && !reduceMotion;
        if (withCurtain) await coverPage(ROUTES[route]);
        swapView(route);
        if (withCurtain) await uncoverPage();
    }

    function swapView(route) {
        const prev = currentRoute && $(`.view[data-view="${currentRoute}"]`);
        const next = $(`.view[data-view="${route}"]`);
        if (prev) { prev.hidden = true; resetReveals(prev); }
        next.hidden = false;
        currentRoute = route;
        document.title = next.dataset.title || document.title;
        window.scrollTo(0, 0);
        setMenu(false);
        setActiveNav(route);
        if (siteReady) observe(next);
        requestAnimationFrame(() => { updateScrollEffects(); updateFilterPill(); });
    }

    const curtain = $('.transition');
    const panels = $$('.transition-panel', curtain);
    const curtainLabel = $('.transition-label');

    async function coverPage(text) {
        curtainLabel.textContent = text;
        curtain.classList.add('is-active');
        curtainLabel.animate(
            [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }],
            { duration: 420, delay: 260, easing: EASE_OUT, fill: 'forwards' }
        );
        await Promise.all(panels.map((panel, i) => panel.animate(
            [{ transform: 'translateY(100%)' }, { transform: 'translateY(0%)' }],
            { duration: 520, delay: i * 70, easing: EASE_IO, fill: 'forwards' }
        ).finished));
        await wait(120);
    }

    async function uncoverPage() {
        curtainLabel.animate(
            [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-40px)' }],
            { duration: 320, easing: EASE_IO, fill: 'forwards' }
        );
        await Promise.all([...panels].reverse().map((panel, i) => panel.animate(
            [{ transform: 'translateY(0%)' }, { transform: 'translateY(-100%)' }],
            { duration: 620, delay: 80 + i * 70, easing: EASE_IO, fill: 'forwards' }
        ).finished));
        curtain.classList.remove('is-active');
        [...panels, curtainLabel].forEach(el => el.getAnimations().forEach(a => a.cancel()));
    }

    // =====================================================================
    // Navigation chrome
    // =====================================================================
    function movePill(container, target) {
        const pill = container && $('.pill', container);
        if (!pill || !target || !target.offsetWidth) return;
        pill.style.width = target.offsetWidth + 'px';
        pill.style.transform = `translateX(${target.offsetLeft}px)`;
        requestAnimationFrame(() => pill.classList.add('is-ready'));
    }

    function setActiveNav(route) {
        $$('[data-route]').forEach(a => {
            const on = a.dataset.route === route;
            a.classList.toggle('is-active', on);
            if (on) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
        });
        movePill(nav, $('a.is-active', nav));
    }

    nav.addEventListener('pointerover', e => {
        const link = e.target.closest('a');
        if (link) movePill(nav, link);
    });
    nav.addEventListener('pointerleave', () => movePill(nav, $('a.is-active', nav)));

    function setMenu(open) {
        if (menuOpen === open) return;
        menuOpen = open;
        document.body.classList.toggle('menu-open', open);
        document.documentElement.classList.toggle('no-scroll', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        $('.sr-only', menuToggle).textContent = open ? 'Close menu' : 'Menu';
        if (open) header.classList.remove('is-hidden');
    }
    menuToggle.addEventListener('click', () => setMenu(!menuOpen));

    // Header state, scroll progress and timeline fill
    const progressBar = $('.progress');
    let lastScrollY = 0;
    function updateScrollEffects() {
        const y = window.scrollY;
        header.classList.toggle('is-scrolled', y > 8);
        if (Math.abs(y - lastScrollY) > 6) {
            header.classList.toggle('is-hidden', y > lastScrollY && y > 160 && !menuOpen);
            lastScrollY = y;
        }
        const max = document.documentElement.scrollHeight - innerHeight;
        progressBar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
        $$('.view:not([hidden]) .timeline').forEach(tl => {
            const r = tl.getBoundingClientRect();
            tl.style.setProperty('--progress', clamp((innerHeight * 0.72 - r.top) / (r.height || 1), 0, 1).toFixed(3));
        });
    }
    let scrollTicking = false;
    addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => { scrollTicking = false; updateScrollEffects(); });
    }, { passive: true });

    // =====================================================================
    // Hero rotator & marquees
    // =====================================================================
    function initRotator() {
        const rotator = $('.rotator');
        if (!rotator) return;
        const words = $$('.rotator-word', rotator);
        let index = 0;
        const fit = () => { rotator.style.width = words[index].offsetWidth + 'px'; };
        fit();
        document.fonts?.ready.then(fit);
        addEventListener('resize', fit);
        if (reduceMotion || words.length < 2) return;
        setInterval(() => {
            if (document.hidden || currentRoute !== 'home') return;
            const prev = words[index];
            index = (index + 1) % words.length;
            const next = words[index];
            prev.classList.remove('is-active');
            prev.classList.add('is-leaving');
            next.classList.remove('is-leaving');
            next.style.transition = 'none';     // jump below without animating…
            next.getBoundingClientRect();
            next.style.transition = '';
            next.classList.add('is-active');     // …then slide up into place
            fit();
        }, 2600);
    }

    // Each track holds two identical groups so translateX(-50%) loops seamlessly
    function initMarquees() {
        $$('.marquee').forEach(marquee => {
            const track = $('.marquee-track', marquee);
            const unit = [...track.children];
            const group = document.createElement('div');
            group.className = 'marquee-group';
            unit.forEach(item => group.appendChild(item));
            while (group.children.length < 12) unit.forEach(item => group.appendChild(item.cloneNode(true)));
            const copy = group.cloneNode(true);
            copy.setAttribute('aria-hidden', 'true');
            $$('img', copy).forEach(img => { img.alt = ''; });
            track.append(group, copy);
        });
    }

    // =====================================================================
    // Pointer effects (desktop only): cursor, spotlight, tilt, magnetic
    // =====================================================================
    function initPointerFx() {
        if (!finePointer || reduceMotion) return;
        document.body.classList.add('has-cursor', 'has-pointer');
        const cursor = $('.cursor');
        const dot = $('.cursor-dot');
        const ring = $('.cursor-ring');
        const bg = $('.bg');
        let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
        let tiltEl = null, magnetEl = null;

        const loop = () => {
            rx += (mx - rx) * 0.18;
            ry += (my - ry) * 0.18;
            dot.style.transform = `translate(${mx}px, ${my}px)`;
            ring.style.transform = `translate(${rx}px, ${ry}px)`;
            bg.style.setProperty('--mx', mx + 'px');
            bg.style.setProperty('--my', my + 'px');
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        document.addEventListener('pointermove', e => {
            if (e.pointerType !== 'mouse') return;
            mx = e.clientX;
            my = e.clientY;
            cursor.classList.remove('is-hidden');

            const tilt = e.target.closest('[data-tilt], .work-link');
            if (tiltEl && tiltEl !== tilt) ['--rx', '--ry'].forEach(p => tiltEl.style.removeProperty(p));
            tiltEl = tilt;
            if (tilt) {
                const r = tilt.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                const max = tilt.matches('.work-link') ? 5 : 10;
                tilt.style.setProperty('--ry', (px * max).toFixed(2) + 'deg');
                tilt.style.setProperty('--rx', (-py * max).toFixed(2) + 'deg');
                tilt.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
                tilt.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
            }

            const magnet = e.target.closest('[data-magnetic]');
            if (magnetEl && magnetEl !== magnet) magnetEl.style.transform = '';
            magnetEl = magnet;
            if (magnet) {
                const r = magnet.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width / 2);
                const dy = e.clientY - (r.top + r.height / 2);
                magnet.style.transform = `translate(${(dx * 0.22).toFixed(1)}px, ${(dy * 0.32).toFixed(1)}px)`;
            }
        }, { passive: true });

        document.addEventListener('pointerover', e => {
            const view = e.target.closest('[data-cursor="view"]');
            const link = e.target.closest('a, button, [role="button"], input, textarea, select, label');
            cursor.classList.toggle('is-view', !!view);
            cursor.classList.toggle('is-link', !view && !!link);
        });
        document.documentElement.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    }

    // =====================================================================
    // Works
    // =====================================================================
    function workCard(w, i) {
        const tags = splitList(w.tech).slice(0, 4);
        const category = String(w.category ?? '').trim();
        const meta = [w.year, w.role].filter(Boolean);
        return `
        <article class="work-card" data-reveal data-category="${esc(category)}" style="--d:${i % 3}">
            <a class="work-link" href="#work/${esc(w.id)}" data-cursor="view" aria-label="${esc(w.title)} — view project">
                <div class="work-media">
                    <img src="${esc(coverOf(w))}" alt="" loading="lazy" decoding="async">
                    ${category ? `<span class="work-cat">${esc(category)}</span>` : ''}
                    <span class="work-arrow" aria-hidden="true">${ICON_ARROW}</span>
                </div>
                <div class="work-body">
                    ${meta.length ? `<div class="work-meta">${meta.map(m => `<span>${esc(m)}</span>`).join('')}</div>` : ''}
                    <h3>${esc(w.title)}</h3>
                    ${w.summary ? `<p>${esc(w.summary)}</p>` : ''}
                    ${tags.length ? `<ul class="work-tags">${tags.map(t => `<li class="tag">${esc(t)}</li>`).join('')}</ul>` : ''}
                </div>
            </a>
        </article>`;
    }

    function renderWorks() {
        const grid = $('#works-grid');
        const featured = $('#featured-grid');
        const stat = $('#stat-works');
        stat.dataset.count = works.length;
        if (stat.closest('.in')) countUp(stat);

        if (!works.length) {
            const empty = '<div class="empty-state"><h3>New projects are on the way</h3><p>Check back soon — or get in touch to hear about recent work.</p></div>';
            grid.innerHTML = featured.innerHTML = empty;
            $('#work-filters').hidden = true;
            return;
        }
        grid.innerHTML = works.map(workCard).join('');
        featured.innerHTML = works.slice(0, 3).map(workCard).join('');
        renderFilters();
    }

    function renderFilters() {
        const box = $('#work-filters');
        $$('.filter', box).forEach(b => b.remove());
        const categories = [...new Set(works.map(w => String(w.category ?? '').trim()).filter(Boolean))];
        if (categories.length < 2) { box.hidden = true; return; }
        box.hidden = false;
        const options = [['*', 'All', works.length], ...categories.map(c => [c, c, works.filter(w => String(w.category ?? '').trim() === c).length])];
        box.insertAdjacentHTML('beforeend', options.map(([value, label, n], i) =>
            `<button type="button" class="filter${i === 0 ? ' is-active' : ''}" data-filter="${esc(value)}" aria-pressed="${i === 0}">${esc(label)}<sup>${n}</sup></button>`
        ).join(''));
        updateFilterPill();
    }

    function updateFilterPill() {
        const box = $('#work-filters');
        movePill(box, $('.filter.is-active', box));
    }

    // FLIP animation: cards glide to their new place, newcomers pop in
    function applyFilter(button) {
        const box = $('#work-filters');
        const value = button.dataset.filter;
        $$('.filter', box).forEach(b => {
            b.classList.toggle('is-active', b === button);
            b.setAttribute('aria-pressed', String(b === button));
        });
        movePill(box, button);
        button.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });

        const cards = $$('#works-grid .work-card');
        const before = new Map(cards.filter(c => !c.hidden).map(c => [c, c.getBoundingClientRect()]));
        cards.forEach(c => { c.hidden = !(value === '*' || c.dataset.category === value); });
        if (reduceMotion) return;
        let n = 0;
        cards.forEach(card => {
            if (card.hidden) return;
            card.classList.add('in');
            const first = before.get(card);
            const last = card.getBoundingClientRect();
            if (first) {
                const dx = first.left - last.left;
                const dy = first.top - last.top;
                if (dx || dy) card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 700, easing: EASE_OUT });
            } else {
                card.animate([{ opacity: 0, transform: 'translateY(30px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 650, delay: n++ * 60, easing: EASE_OUT, fill: 'backwards' });
            }
        });
    }

    // =====================================================================
    // Project detail (dialog / bottom sheet on mobile)
    // =====================================================================
    const project = { isOpen: false, closeTimer: null };
    const projectScroll = $('.project-scroll', dialog);

    const findWork = id => works.findIndex(w => String(w.id) === String(id));

    function fillProject(index) {
        const w = works[index];
        const img = $('#project-img');
        img.src = coverOf(w);
        img.alt = w.title ? `${w.title} — cover image` : '';

        const prev = works[(index - 1 + works.length) % works.length];
        const next = works[(index + 1) % works.length];
        const facts = [['Year', w.year], ['Role', w.role], ['Category', w.category]].filter(([, v]) => v);
        const tech = splitList(w.tech);
        const live = safeUrl(w.live_url);
        const repo = safeUrl(w.repo_url);
        const links = [
            live && `<a class="btn btn-primary btn-sm" href="${esc(live)}" target="_blank" rel="noopener">Visit live <span class="arrow">↗</span></a>`,
            repo && `<a class="btn btn-sm" href="${esc(repo)}" target="_blank" rel="noopener">Source code <span class="arrow">↗</span></a>`
        ].filter(Boolean);

        $('#project-content').innerHTML = `
            <p class="eyebrow" style="--d:0">${[w.category, w.year].filter(Boolean).map(esc).join(' · ') || 'Project'}</p>
            <h2 class="project-title" id="project-title" style="--d:1">${esc(w.title)}</h2>
            ${w.summary ? `<p class="project-summary" style="--d:2">${esc(w.summary)}</p>` : ''}
            <div class="project-cols" style="--d:3">
                <div class="project-desc">${paragraphs(w.description) || '<p>More details coming soon.</p>'}</div>
                <aside class="project-facts">
                    ${facts.map(([k, v]) => `<div class="fact"><div class="k">${k}</div><div>${esc(v)}</div></div>`).join('')}
                    ${tech.length ? `<div class="fact"><div class="k">Stack</div><div class="tags">${tech.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>` : ''}
                    ${links.length ? `<div class="project-links">${links.join('')}</div>` : ''}
                </aside>
            </div>
            ${works.length > 1 ? `
            <nav class="project-nav" style="--d:4" aria-label="More projects">
                <button type="button" data-goto="${esc(prev.id)}"><small>← Previous</small><b>${esc(prev.title)}</b></button>
                <button type="button" data-goto="${esc(next.id)}"><small>Next →</small><b>${esc(next.title)}</b></button>
            </nav>` : ''}`;
    }

    function openProject(id) {
        const index = findWork(id);
        if (index < 0) { history.replaceState(null, '', '#work'); return; }
        fillProject(index);
        if (project.isOpen) return;
        project.isOpen = true;
        clearTimeout(project.closeTimer);
        dialog.style.removeProperty('--drag');
        if (!dialog.open) dialog.showModal();
        projectScroll.scrollTop = 0;
        document.documentElement.classList.add('no-scroll');
        $('.cursor')?.classList.remove('is-view', 'is-link');
        requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add('is-open')));
    }

    function closeProject({ fromRouter = false } = {}) {
        if (!project.isOpen) return;
        project.isOpen = false;
        dialog.classList.remove('is-open', 'is-dragging');
        document.documentElement.classList.toggle('no-scroll', menuOpen);
        if (!fromRouter && parseHash().sub) history.replaceState(null, '', '#work');
        project.closeTimer = setTimeout(() => {
            dialog.close();
            dialog.style.removeProperty('--drag');
        }, reduceMotion ? 0 : 650);
    }

    async function switchProject(id) {
        const index = findWork(id);
        if (index < 0) return;
        dialog.classList.add('is-switching');
        await wait(reduceMotion ? 0 : 260);
        fillProject(index);
        history.replaceState(null, '', `#work/${id}`);
        projectScroll.scrollTop = 0;
        await nextFrame();
        dialog.classList.remove('is-switching');
    }

    dialog.addEventListener('cancel', e => { e.preventDefault(); closeProject(); });
    // The browser may close the dialog itself (e.g. a repeated Escape); keep our state in sync
    dialog.addEventListener('close', () => {
        if (!project.isOpen) return;
        project.isOpen = false;
        dialog.classList.remove('is-open', 'is-dragging');
        document.documentElement.classList.toggle('no-scroll', menuOpen);
        if (parseHash().sub) history.replaceState(null, '', '#work');
    });

    // Pull the sheet down to close it (touch, when scrolled to the top)
    (() => {
        const sheet = $('.project-sheet', dialog);
        let startY = null, dragging = false, dy = 0;
        sheet.addEventListener('touchstart', e => {
            if (innerWidth >= 880 || e.touches.length > 1) return;
            startY = e.touches[0].clientY;
            dragging = false;
            dy = 0;
        }, { passive: true });
        sheet.addEventListener('touchmove', e => {
            if (startY == null) return;
            dy = e.touches[0].clientY - startY;
            if (!dragging) {
                if (dy > 6 && projectScroll.scrollTop <= 0) { dragging = true; dialog.classList.add('is-dragging'); }
                else if (Math.abs(dy) > 6) { startY = null; return; }
            }
            if (dragging) {
                e.preventDefault();
                dialog.style.setProperty('--drag', Math.max(0, dy) + 'px');
            }
        }, { passive: false });
        sheet.addEventListener('touchend', () => {
            if (dragging) {
                dialog.classList.remove('is-dragging');
                if (dy > 110) closeProject();
                else dialog.style.setProperty('--drag', '0px');
            }
            startY = null;
            dragging = false;
        });
    })();

    // =====================================================================
    // Resume
    // =====================================================================
    function languageLevel(p) {
        if (p >= 85) return 'Fluent';
        if (p >= 60) return 'Professional working proficiency';
        if (p >= 35) return 'Intermediate';
        return 'Elementary';
    }

    const cleanLanguage = name => String(name ?? '').replace(/\s*language\s*$/i, '').toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());

    function renderResume(data) {
        $('#career-container').innerHTML = data.career.map((r, i) => {
            const roles = String(r.position ?? '').split('|').map(s => s.trim()).filter(Boolean);
            return `
            <li class="tl-item" data-reveal style="--d:${i}">
                <span class="tl-num" aria-hidden="true">${pad(i + 1)}</span>
                <span class="tl-date">${esc(r.date_range)}</span>
                <h3>${esc(r.company)}</h3>
                ${roles.length > 1 ? `<ul class="tl-roles">${roles.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : roles.length ? `<p>${esc(roles[0])}</p>` : ''}
                ${r.location ? `<p class="tl-loc">${ICON_PIN} ${esc(r.location)}</p>` : ''}
            </li>`;
        }).join('');

        $('#education-container').innerHTML = data.education.map((r, i) => `
            <li class="tl-item" data-reveal style="--d:${i}">
                <span class="tl-num" aria-hidden="true">${pad(i + 1)}</span>
                <span class="tl-date">${esc(r.graduation_year)}</span>
                <h3>${esc(r.institution)}</h3>
                <p>${esc([r.degree, r.description].filter(Boolean).join(' — '))}</p>
            </li>`).join('');

        $('#skills-container').innerHTML = data.skills.map((s, i) => {
            const p = clamp(Number(s.percentage) || 0, 0, 100);
            const long = String(s.description ?? '').length > 200;
            return `
            <article class="skill-card" data-reveal style="--d:${i % 2}">
                <div class="ring" style="--p:${p}" role="img" aria-label="${p}% proficiency">
                    <svg viewBox="0 0 100 100" aria-hidden="true"><circle class="track" cx="50" cy="50" r="44"/><circle class="bar" cx="50" cy="50" r="44" pathLength="100"/></svg>
                    <span class="ring-num" aria-hidden="true"><span><span data-count="${p}">0</span><small>%</small></span></span>
                </div>
                <div>
                    <h3>${esc(s.name)}</h3>
                    ${s.description ? `<p class="skill-desc">${esc(s.description)}</p>` : ''}
                    ${long ? '<button type="button" class="more-btn" aria-expanded="false">Read more</button>' : ''}
                </div>
            </article>`;
        }).join('');

        $('#language-container').innerHTML = data.languages.map((l, i) => {
            const p = clamp(Number(l.percentage) || 0, 0, 100);
            return `
            <div class="lang" style="--d:${i}">
                <div class="lang-head">
                    <span>${esc(cleanLanguage(l.name))}<span class="lvl">${languageLevel(p)}</span></span>
                    <b><span data-count="${p}">0</span>%</b>
                </div>
                <div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="${esc(cleanLanguage(l.name))}"><span style="--p:${p / 100}"></span></div>
            </div>`;
        }).join('');
    }

    // =====================================================================
    // Data
    // =====================================================================
    const dataReady = window.SiteData ? window.SiteData.ready : Promise.reject(new Error('Data loader missing'));

    function applyData(data) {
        works = data.works;
        renderWorks();
        renderResume(data);
        if (data.isDraft) {
            document.body.insertAdjacentHTML('beforeend', '<div class="draft-pill" role="status">● Previewing unpublished draft from admin</div>');
        }
        if (siteReady) {
            observe($(`.view[data-view="${currentRoute}"]`));
            $$('.in [data-count]').forEach(countUp);
        }
        updateScrollEffects();
    }

    function showDataError(error) {
        console.error('Error loading portfolio data:', error);
        const msg = '<div class="load-error" role="alert">Couldn’t load this content. Please check your connection and refresh the page.</div>';
        ['#works-grid', '#featured-grid'].forEach(sel => { $(sel).innerHTML = msg; });
        $('#work-filters').hidden = true;
        $('#skills-container').innerHTML = msg;
    }

    // =====================================================================
    // Loader
    // =====================================================================
    async function runLoader() {
        const loader = $('.loader');
        const bar = $('.loader-bar');
        const count = $('.loader-count');
        let dataDone = false;
        dataReady.then(() => { dataDone = true; }, () => { dataDone = true; });

        const minTime = reduceMotion ? 0 : 1100;
        const maxWait = 4000;
        const start = performance.now();
        await new Promise(resolve => {
            const tick = now => {
                const t = now - start;
                const p = Math.min(t / Math.max(minTime, 1), 1) * 0.86 + (dataDone ? 0.14 : 0);
                bar.style.setProperty('--p', p.toFixed(3));
                count.textContent = String(Math.round(p * 100)).padStart(3, '0');
                if (t >= minTime && (dataDone || t > maxWait)) resolve();
                else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });

        loader.classList.add('is-done');
        await wait(reduceMotion ? 0 : 320);
        siteReady = true;
        observe($(`.view[data-view="${currentRoute}"]`));
        observe($('.site-footer'));
        setTimeout(() => loader.remove(), 1200);
    }

    // =====================================================================
    // Events
    // =====================================================================
    document.addEventListener('click', e => {
        const link = e.target.closest('a[href^="#"]');
        if (link) {
            const href = link.getAttribute('href');
            if (href === '#main') {
                e.preventDefault();
                $('#main').focus();
                return;
            }
            const same = href === location.hash || (href === '#home' && !location.hash);
            if (same) {
                e.preventDefault();
                setMenu(false);
                window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
            }
            return;
        }

        const filter = e.target.closest('.filter');
        if (filter) { applyFilter(filter); return; }

        const more = e.target.closest('.more-btn');
        if (more) {
            const card = more.closest('.skill-card');
            const expanded = card.classList.toggle('is-expanded');
            more.textContent = expanded ? 'Show less' : 'Read more';
            more.setAttribute('aria-expanded', String(expanded));
            return;
        }

        if (e.target.closest('#project [data-close]')) { closeProject(); return; }
        const goto = e.target.closest('[data-goto]');
        if (goto) { switchProject(goto.dataset.goto); return; }

        if (e.target.closest('#to-top')) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (project.isOpen) { e.preventDefault(); closeProject(); }
        else if (menuOpen) setMenu(false);
    });

    addEventListener('hashchange', () => queueRoute(true));

    let resizeTimer;
    addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (innerWidth >= 880) setMenu(false);
            setActiveNav(currentRoute);
            updateFilterPill();
            updateScrollEffects();
        }, 120);
    });
    document.fonts?.ready.then(() => { setActiveNav(currentRoute); updateFilterPill(); });

    // =====================================================================
    // Boot
    // =====================================================================
    $('#main').setAttribute('tabindex', '-1');
    $('#year').textContent = new Date().getFullYear();
    $$('[data-since]').forEach(el => { el.dataset.count = new Date().getFullYear() - Number(el.dataset.since); });
    $$('[data-reveal="split"]').forEach(splitText);

    initMarquees();
    initRotator();
    initPointerFx();
    dataReady.then(applyData, showDataError);
    queueRoute(false);
    runLoader();
})();

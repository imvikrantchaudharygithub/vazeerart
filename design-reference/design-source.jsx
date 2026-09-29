
class Component extends DCLogic {
  state = { page: 'home', slug: null, filter: 'All', type: 'Music video', sent: false, menu: false };

  componentDidMount() {
    try {
      const s = JSON.parse(localStorage.getItem('vazeer-v2-route') || 'null');
      if (s && s.page) this.setState({ page: s.page, slug: s.slug || null });
    } catch (e) {}
    this.startLeader();
    this.mx = 0; this.my = 0; this.cx = 0; this.cy = 0;
    this.onMove = e => { this.mx = e.clientX / window.innerWidth - 0.5; this.my = e.clientY / window.innerHeight - 0.5; };
    window.addEventListener('mousemove', this.onMove);
    const loop = () => {
      this.cx += (this.mx - this.cx) * 0.08; this.cy += (this.my - this.cy) * 0.08;
      const sy = Math.min(window.scrollY, 1200);
      document.querySelectorAll('[data-depth]').forEach(el => {
        const d = +el.dataset.depth, k = +el.dataset.scroll || 0;
        el.style.transform = `translate3d(${(this.cx * d * 28).toFixed(2)}px,${(this.cy * d * 20 + sy * k).toFixed(2)}px,0)`;
      });
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    setTimeout(() => this.scanReveal(), 50);
    const t0 = Date.now();
    this.tc = setInterval(() => {
      const f = Math.floor((Date.now() - t0) / 40);
      const p = n => String(n).padStart(2, '0');
      const txt = `${p(Math.floor(f / 90000) % 24)}:${p(Math.floor(f / 1500) % 60)}:${p(Math.floor(f / 25) % 60)}:${p(f % 25)}`;
      document.querySelectorAll('[data-tc]').forEach(el => { el.textContent = txt; });
    }, 40);
  }
  componentDidUpdate() { this.scanReveal(); }
  componentWillUnmount() { clearInterval(this.tc); cancelAnimationFrame(this.raf); window.removeEventListener('mousemove', this.onMove); (this.lt || []).forEach(clearTimeout); this.io && this.io.disconnect(); }

  startLeader() {
    let seen = false;
    try { seen = sessionStorage.getItem('vazeer-leader') === '1'; } catch (e) {}
    if (!(this.props.intro ?? true) || seen) return;
    this.setState({ leader: 3, leaderOut: false });
    this.lt = [
      setTimeout(() => this.setState({ leader: 2 }), 700),
      setTimeout(() => this.setState({ leader: 1 }), 1400),
      setTimeout(() => this.setState({ leaderOut: true }), 2100),
      setTimeout(() => this.endLeader(), 2700)
    ];
  }
  endLeader() {
    (this.lt || []).forEach(clearTimeout);
    try { sessionStorage.setItem('vazeer-leader', '1'); } catch (e) {}
    this.setState({ leader: null, leaderOut: false });
  }

  scanReveal() {
    if (!this.io) this.io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.translate = '0 0'; this.io.unobserve(e.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]:not([data-rv])').forEach((el, i) => {
      el.setAttribute('data-rv', '1');
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      el.style.opacity = '0'; el.style.translate = '0 56px';
      el.style.transition = `opacity 1s cubic-bezier(.2,.8,.2,1) ${(i % 3) * 0.08}s, translate 1s cubic-bezier(.2,.8,.2,1) ${(i % 3) * 0.08}s`;
      this.io.observe(el);
    });
  }

  go(page, slug = null) {
    this.setState({ page, slug, menu: false });
    try { localStorage.setItem('vazeer-v2-route', JSON.stringify({ page, slug })); } catch (e) {}
    window.scrollTo(0, 0);
  }

  renderVals() {
    const { page, slug, filter, type, sent, menu } = this.state;
    const P = [
      { slug: 'pagal', title: 'Pagal', format: 'Music Video', year: '2022', role: 'Director of Photography', roleShort: 'DOP' },
      { slug: 'dehleez', title: 'Dehleez', format: 'TV Mini Series', year: '2022', role: 'Director of Photography', roleShort: 'DOP' },
      { slug: 'chakk-ke-glass', title: 'Chakk ke Glass', format: 'Short Film', year: '2021', role: 'Director of Photography', roleShort: 'DOP' },
      { slug: 'booti-shake', title: 'Booti Shake', format: 'Music Video', year: '2020', role: 'Editor', roleShort: 'Editor' },
      { slug: 'love-marriage', title: 'Love Marriage', format: 'Music Video', year: '2020', role: 'Editor', roleShort: 'Editor' }
    ];
    const match = p => filter === 'All' || (filter === 'Cinematography' ? p.roleShort === 'DOP' : p.roleShort === 'Editor');
    const U = {
      A: ['1625690303837-654c9666d2d0', 'Jakob Owens', 'jakobowens1'], B: ['1515634928627-2a4e0dae3ddf', 'Avel Chuklanov', 'chuklanov'],
      C: ['1576280314550-773c50583407', 'Kyle Loftus', 'kyleloftusstudios'], D: ['1632187981988-40f3cbaeef5e', 'Jakob Owens', 'jakobowens1'],
      E: ['1506434304575-afbb92660c28', 'KOBU Agency', 'kobuagency'], F: ['1611784728558-6c7d9b409cdf', 'Kyle Loftus', 'kyleloftusstudios'],
      G: ['1497015289639-54688650d173', 'Sam McGhee', 'sammcghee'], H: ['1518930259200-3e5b29f42096', 'Chris Murray', 'seemurray'],
      I: ['1612548403247-aa2873e9422d', 'Sirisvisual', 'sirisvisual'], J: ['1587050265310-1a2d98ccce5f', 'Kyle Loftus', 'kyleloftusstudios'],
      K: ['1603126004251-d01882b9bfd3', 'Kyle Loftus', 'kyleloftusstudios'], L: ['1632187989763-c9c620420b4d', 'Jakob Owens', 'jakobowens1'],
      M: ['1603126004372-e63e3b53934b', 'Kyle Loftus', 'kyleloftusstudios'], N: ['1576280314591-b115fb8f4f79', 'Kyle Loftus', 'kyleloftusstudios'],
      O: ['1621701816825-b5abfadae6c3', 'Billy Freeman', 'billyfreeman'], P: ['1485846234645-a62644f84728', 'Jakob Owens', 'jakobowens1'],
      Q: ['1440404653325-ab127d49abc1', 'Noom Peerapong', 'imnoom'], R: ['1617195737496-bc30194e3a19', 'Ouael Ben Salah', 'benwksi'],
      S: ['1594909122845-11baa439b7bf', 'Jon Tyson', 'jontyson'], T: ['1568876694728-451bbf694b83', 'Jason Dent', 'jdent'],
      V: ['1542204165-65bf26472b9b', 'Denise Jans', 'dmjdenise'], W: ['1581591524425-c7e0978865fc', 'TheRegisti', 'theregisti']
    };
    const img = (k, w = 1200) => { const [id, name, h] = U[k]; return { src: (window.__resources || {})['u' + id.replace(/-/g, '_')] || `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=65`, credit: `Photo by ${name} on Unsplash`, href: `https://unsplash.com/@${h}` }; };
    const covers = { 'pagal': 'A', 'dehleez': 'M', 'chakk-ke-glass': 'S', 'booti-shake': 'D', 'love-marriage': 'P' };
    const grabPool = ['C', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'N', 'O', 'Q', 'R', 'T', 'V', 'W', 'L'];
    let vi = 0;
    const projects = P.map((p, i) => {
      const g = n => img(grabPool[(i * 3 + n) % grabPool.length], 1000);
      const nx = P[(i + 1) % P.length];
      const visible = match(p);
      const order = visible && (vi++ % 2) ? 2 : 0;
      return { ...p, n: String(i + 1).padStart(2, '0'), formatLower: p.format.toLowerCase(), visible, order,
        ...img(covers[p.slug], 1800), g1: g(0), g2: g(1), g3: g(2), g4: g(3),
        isOpen: page === 'project' && slug === p.slug,
        open: () => this.go('project', p.slug), next: () => this.go('project', nx.slug), nextTitle: nx.title };
    });
    const cur = page === 'project' ? 'work' : page;
    const pages = [['home', 'Home'], ['about', 'About'], ['work', 'Work & Reels'], ['frames', 'Frames'], ['contact', 'Contact']];
    const ratios = ['4/5', '9/16', '4/5', '1/1', '4/5', '9/16', '4/5', '4/5', '1/1', '9/16', '4/5', '4/5'];
    const pre = [
      { k: 'about', sub: 'learn more', label: 'About me' },
      { k: 'work', sub: 'watch the', label: 'Reels' },
      { k: 'frames', sub: 'browse the', label: 'Frames' },
      { k: 'contact', sub: 'get in', label: 'Touch' }
    ].filter(c => c.k !== cur).slice(0, 3).map(c => ({ ...c, go: () => this.go(c.k) }));
    const leaderOn = this.state.leader != null;
    const frameKeys = ['C', 'E', 'F', 'J', 'K', 'N', 'S', 'P', 'Q', 'T', 'V', 'W'];
    const exploreKeys = { 'explore-work': 'B', 'explore-frames': 'T', 'explore-contact': 'L' };
    const res = {u1576280314550_773c50583407: (window.__resources || {}).u1576280314550_773c50583407 || 'https://images.unsplash.com/photo-1576280314550-773c50583407?auto=format&fit=crop&w=1400&q=65', u1625690303837_654c9666d2d0: (window.__resources || {}).u1625690303837_654c9666d2d0 || 'https://images.unsplash.com/photo-1625690303837-654c9666d2d0?auto=format&fit=crop&w=1400&q=65', u1587050265310_1a2d98ccce5f: (window.__resources || {}).u1587050265310_1a2d98ccce5f || 'https://images.unsplash.com/photo-1587050265310-1a2d98ccce5f?auto=format&fit=crop&w=1400&q=65', u1568876694728_451bbf694b83: (window.__resources || {}).u1568876694728_451bbf694b83 || 'https://images.unsplash.com/photo-1568876694728-451bbf694b83?auto=format&fit=crop&w=1400&q=65', u1603126004251_d01882b9bfd3: (window.__resources || {}).u1603126004251_d01882b9bfd3 || 'https://images.unsplash.com/photo-1603126004251-d01882b9bfd3?auto=format&fit=crop&w=1400&q=65', u1518930259200_3e5b29f42096: (window.__resources || {}).u1518930259200_3e5b29f42096 || 'https://images.unsplash.com/photo-1518930259200-3e5b29f42096?auto=format&fit=crop&w=1400&q=65', u1617195737496_bc30194e3a19: (window.__resources || {}).u1617195737496_bc30194e3a19 || 'https://images.unsplash.com/photo-1617195737496-bc30194e3a19?auto=format&fit=crop&w=1400&q=65', u1632187989763_c9c620420b4d: (window.__resources || {}).u1632187989763_c9c620420b4d || 'https://images.unsplash.com/photo-1632187989763-c9c620420b4d?auto=format&fit=crop&w=1400&q=65', u1576280314591_b115fb8f4f79: (window.__resources || {}).u1576280314591_b115fb8f4f79 || 'https://images.unsplash.com/photo-1576280314591-b115fb8f4f79?auto=format&fit=crop&w=1400&q=65', u1506434304575_afbb92660c28: (window.__resources || {}).u1506434304575_afbb92660c28 || 'https://images.unsplash.com/photo-1506434304575-afbb92660c28?auto=format&fit=crop&w=1400&q=65', u1515634928627_2a4e0dae3ddf: (window.__resources || {}).u1515634928627_2a4e0dae3ddf || 'https://images.unsplash.com/photo-1515634928627-2a4e0dae3ddf?auto=format&fit=crop&w=1400&q=65', u1632187981988_40f3cbaeef5e: (window.__resources || {}).u1632187981988_40f3cbaeef5e || 'https://images.unsplash.com/photo-1632187981988-40f3cbaeef5e?auto=format&fit=crop&w=1400&q=65', u1611784728558_6c7d9b409cdf: (window.__resources || {}).u1611784728558_6c7d9b409cdf || 'https://images.unsplash.com/photo-1611784728558-6c7d9b409cdf?auto=format&fit=crop&w=1400&q=65', u1497015289639_54688650d173: (window.__resources || {}).u1497015289639_54688650d173 || 'https://images.unsplash.com/photo-1497015289639-54688650d173?auto=format&fit=crop&w=1400&q=65', u1612548403247_aa2873e9422d: (window.__resources || {}).u1612548403247_aa2873e9422d || 'https://images.unsplash.com/photo-1612548403247-aa2873e9422d?auto=format&fit=crop&w=1400&q=65', u1603126004372_e63e3b53934b: (window.__resources || {}).u1603126004372_e63e3b53934b || 'https://images.unsplash.com/photo-1603126004372-e63e3b53934b?auto=format&fit=crop&w=1400&q=65', u1621701816825_b5abfadae6c3: (window.__resources || {}).u1621701816825_b5abfadae6c3 || 'https://images.unsplash.com/photo-1621701816825-b5abfadae6c3?auto=format&fit=crop&w=1400&q=65', u1485846234645_a62644f84728: (window.__resources || {}).u1485846234645_a62644f84728 || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=65', u1440404653325_ab127d49abc1: (window.__resources || {}).u1440404653325_ab127d49abc1 || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1400&q=65', u1594909122845_11baa439b7bf: (window.__resources || {}).u1594909122845_11baa439b7bf || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=1400&q=65', u1542204165_65bf26472b9b: (window.__resources || {}).u1542204165_65bf26472b9b || 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=1400&q=65', u1581591524425_c7e0978865fc: (window.__resources || {}).u1581591524425_c7e0978865fc || 'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?auto=format&fit=crop&w=1400&q=65'};
    return {
      res,
      showLeader: leaderOn, leaderNum: this.state.leader, leaderOpacity: this.state.leaderOut ? 0 : 1, skipLeader: () => this.endLeader(),
      isHome: page === 'home' && !(leaderOn && !this.state.leaderOut), isWork: page === 'work', isFrames: page === 'frames', isAbout: page === 'about', isContact: page === 'contact',
      goHome: () => this.go('home'), goWork: () => this.go('work'), goAbout: () => this.go('about'), goContact: () => this.go('contact'),
      menuOpen: menu, openMenu: () => this.setState({ menu: true }), closeMenu: () => this.setState({ menu: false }),
      navItems: pages.slice(1).map(([k, label]) => ({ label, go: () => this.go(k), color: cur === k ? '#e8a24a' : '#efe7da' })),
      menuItems: pages.map(([k, label], i) => ({ label, n: String(i + 1).padStart(2, '0'), go: () => this.go(k) })),
      projects,
      reelOrder: P.map(p => p.title).join(', '),
      marquee: ['Films', 'Commercials', 'Music Videos', 'Colour', 'The Edit', 'Films', 'Commercials', 'Music Videos', 'Colour', 'The Edit'].map(t => ({ t })),
      explore: [
        { id: 'explore-work', label: 'Work & Reels', sub: 'watch', ph: 'Still from a music video', go: () => this.go('work') },
        { id: 'explore-frames', label: 'Frames', sub: 'browse', ph: 'Best Instagram frame', go: () => this.go('frames') },
        { id: 'explore-contact', label: 'Get in touch', sub: 'book', ph: 'Vazeer with the gimbal', go: () => this.go('contact') }
      ].map(e => ({ ...e, ...img(exploreKeys[e.id], 1000) })),
      filters: ['All', 'Cinematography', 'Editing'].map(label => ({ label, pick: () => this.setState({ filter: label }),
        color: filter === label ? '#efe7da' : '#b9b0a2', line: filter === label ? '#e8a24a' : 'transparent' })),
      skills: [['gimbal', '-3deg'], ['colour grading', '2deg'], ['the edit', '-2deg'], ['music videos', '3deg']].map(([label, rot], i) => ({ label, rot, id: 'skill-' + i, ...img(['O', 'W', 'G', 'M'][i], 700) })),
      frames: ratios.map((r, i) => ({ id: 'ig-' + (i + 1), ratio: r, ...img(frameKeys[i], 900), label: r === '9/16' ? 'Reel cover' : 'Instagram post' })),
      types: ['Music video', 'Commercial', 'Film / Series', 'Edit only'].map(label => ({ label, pick: () => this.setState({ type: label }),
        bg: type === label ? '#14110e' : 'transparent', color: type === label ? '#efe7da' : '#14110e' })),
      preFooter: pre,
      sent, notSent: !sent,
      submit: e => { e.preventDefault(); this.setState({ sent: true }); },
      resetForm: () => this.setState({ sent: false }),
      showRec: this.props.showRec ?? true,
      showMarquee: this.props.marquee ?? true,
      grain: this.props.grain ?? true,
      grainBg: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`
    };
  }
}

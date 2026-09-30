
class Component extends DCLogic {
  stageRef = React.createRef();
  componentDidMount() {
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(() => this.setup(), 60));
  }
  componentWillUnmount() { cancelAnimationFrame(this.raf); }
  setup() {
    const root = this.stageRef.current; if (!root) return;
    const q = k => root.querySelector(`[data-m="${k}"]`);
    const el = this.el = { photo: q('photo'), grad: q('grad'), amber: q('amber'), thumb: q('thumb'), art: q('art'),
      p: [0, 1, 2].map(i => q('p' + i)), o: [0, 1, 2].map(i => q('o' + i)) };
    const w = el.p.map(e => e.offsetWidth), s = 124 / 250;
    const W = w.reduce((a, b) => a + b, 0) * s, x0 = (390 - W) / 2;
    let cx = x0;
    this.A = w.map(wi => { const r = { x: cx, y: 583, s }; cx += wi * s; return r; });
    this.B = w.map((wi, i) => ({ x: (390 - wi) / 2, y: 130 + i * 200, s: 1 }));
    const wa = el.art.offsetWidth, ka = 90 / 124;
    this.artA = { x: x0 + W - wa * ka + 4, y: 655, k: ka, r: -8 };
    this.artB = { x: 390 - 28 - wa, y: 676, k: 1, r: -10 };
    el.p.forEach(e => (e.style.opacity = '1'));
    el.art.style.opacity = '1';
    this.t0 = performance.now();
    const loop = () => { this.frame(); this.raf = requestAnimationFrame(loop); };
    loop();
  }
  frame() {
    const H1 = 1600, M = 2600, H2 = 2600, e = (performance.now() - this.t0) % (H1 + 2 * M + H2);
    const t = e < H1 ? 0 : e < H1 + M ? (e - H1) / M : e < H1 + M + H2 ? 1 : 1 - (e - H1 - M - H2) / M;
    this.apply(t);
  }
  apply(t) {
    const el = this.el;
    const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const seg = (a, b) => ease(Math.min(1, Math.max(0, (t - a) / (b - a))));
    const L = (a, b, p) => a + (b - a) * p;
    const mix = (c1, c2, p) => `rgb(${c1.map((v, i) => Math.round(L(v, c2[i], p))).join(',')})`;
    const INK = [20, 17, 14], CREAM = [239, 231, 218], AMBER = [232, 162, 74];
    const ph = seg(0, .7), ring = seg(.55, .9);
    Object.assign(el.photo.style, {
      left: L(0, 37, ph) + 'px', top: L(0, 250, ph) + 'px', width: L(390, 316, ph) + 'px', height: L(480, 316, ph) + 'px',
      borderRadius: L(0, 158, ph) + 'px',
      boxShadow: `0 0 0 ${10 * ring}px #0f0d0b, 0 0 0 ${11 * ring}px rgba(239,231,218,${.35 * ring}), 0 30px 70px rgba(0,0,0,${.6 * ring})`
    });
    el.grad.style.opacity = 1 - ph;
    el.amber.style.top = L(480, 844, seg(.1, .7)) + 'px';
    const col = mix(INK, CREAM, seg(.15, .6)), outl = seg(.78, 1);
    [0, 1, 2].forEach(i => {
      const p = seg(.12 + i * .06, .72 + i * .06), a = this.A[i], b = this.B[i];
      const tf = `translate(${L(a.x, b.x, p)}px,${L(a.y, b.y, p)}px) scale(${L(a.s, b.s, p)})`;
      el.p[i].style.transform = tf; el.p[i].style.color = col;
      el.o[i].style.transform = tf; el.o[i].style.opacity = outl;
    });
    const pa = seg(.3, .9), A = this.artA, B = this.artB;
    el.art.style.transform = `translate(${L(A.x, B.x, pa)}px,${L(A.y, B.y, pa)}px) rotate(${L(A.r, B.r, pa)}deg) scale(${L(A.k, B.k, pa)})`;
    el.art.style.color = mix(INK, AMBER, seg(.3, .75));
    const pt = seg(0, .5);
    el.thumb.style.transform = `translate(${113 * pt}px,${-77 * pt}px) rotate(${L(-6, 10, pt)}deg) scale(${L(1, .3, pt)})`;
    el.thumb.style.opacity = 1 - seg(.2, .5);
  }
  renderVals() { return { stageRef: this.stageRef }; }
}

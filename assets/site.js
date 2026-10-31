// The one place the domain lives. It's printed on every card and in the footer.
// Change it here and nowhere else once a real domain is bought (the og:image
// tags in the HTML hold the full URL too, see the README).
window.SITE = 'mergetel.github.io/drr';

(() => {
  // The site root, worked out from where this script was loaded. On GitHub Pages
  // without a custom domain that's /drr/, with one it's /.
  const BASE = new URL('..', document.currentScript.src).pathname;
  window.BASE = BASE;

  const here = location.pathname.replace(/index\.html$/, '');
  const link = (path, text) =>
    `<a href="${BASE}${path}"${here === BASE + path ? ' aria-current="page"' : ''}>${text}</a>`;

  const nav = document.getElementById('nav');
  if (nav) {
    nav.innerHTML = `
      <div class="wrap navbar">
        <a class="brand" href="${BASE}" aria-label="DRR home">
          <svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="drr-g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><rect x="4" y="22" width="5" height="6" rx="1.5" fill="url(#drr-g)"/><rect x="11.5" y="17" width="5" height="11" rx="1.5" fill="url(#drr-g)"/><rect x="19" y="9" width="5" height="19" rx="1.5" fill="url(#drr-g)"/><rect x="26.5" y="2" width="3.5" height="26" rx="1.5" fill="url(#drr-g)"/></svg>
          <span>DRR</span>
        </a>
        <nav aria-label="Main">
          ${link('', 'Generator')}
          ${link('leaderboard/', 'Leaderboard')}
        </nav>
        <a class="btn btn-primary btn-sm" href="${BASE}#make">Get your DRR</a>
      </div>`;
  }

  const foot = document.getElementById('foot');
  if (foot) {
    foot.innerHTML = `
      <div class="wrap">
        <section class="john" aria-labelledby="why">
          <h2 id="why">Why this exists</h2>
          <p>Every year or so the number changes. It was MRR for a long time. Then everybody started posting ARR, because a number times twelve is a nicer number. I figured I'd skip ahead a decade and save us all the trouble.</p>
          <p>My own chart would be pretty flat. I'm told that's normal, and I'd still rather tell people what I shipped than show them a number I multiplied.</p>
          <p>There's a box that sets the whole thing to zero. I tick it about once a week.</p>
          <p>What I actually use is <a href="https://merge.tel">merge.tel</a>. It reads the pull requests I merge and writes the post about what changed, so I post the work instead of a projection. I use it every day on merge.tel and my other projects.</p>
        </section>
        <div class="footbar">
          <p>DRR is a parody. The companies, founders, quotes and numbers on it are made up. Nothing on this site is revenue, and nothing you type leaves your browser.</p>
          <p><a href="${BASE}">Generator</a> · <a href="${BASE}leaderboard/">Leaderboard</a> · <a href="https://merge.tel">merge.tel</a></p>
        </div>
        <!-- whois:start. The same block is on every mergetel satire site. See "The footer" in the README. -->
        <section class="whois" aria-labelledby="whois-h">
          <h2 id="whois-h">Who made this</h2>
          <p>I'm John. I make software on my own, with more AI agents helping than is probably healthy. I did the enterprise job for twenty years and I'm unemployable now, so the real stuff below has to work.</p>
          <ul>
            <li><a href="https://johnf.build">johnf.build</a><span>what I'm building and how it's going</span></li>
            <li><a href="https://merge.tel">merge.tel</a><span>turns merged pull requests into customer updates</span></li>
            <li><a href="https://screenery.dev">Screenery</a><span>screenshots that update themselves on every release</span></li>
          </ul>
        </section>
        <!-- whois:end -->
      </div>`;
  }

  document.querySelectorAll('[data-site]').forEach((el) => { el.textContent = window.SITE; });
})();

# Decennial Recurring Revenue

MRR is so last month. ARR is the new hotness. DRR is the future. It adds up ten years of revenue you haven't made yet, so the number is much bigger.

This is a DRR generator. You answer a few questions about your vibes, your sleep, how many times you said "agentic" this week and whether the logo is a gradient, and it draws a share card with an enormous made-up number on it. One checkbox, "AI will kill us all", sets DRR to $0 whatever else you ticked, because a decade of revenue needs a decade.

It's a parody, and a satire site for [merge.tel](https://merge.tel), which turns merged pull requests into posts about what changed, so you can post the work instead of a projection.

## What's here

| Path | What it is |
|---|---|
| `index.html` | The generator, a straight-faced explainer of the model, made-up founder quotes and a FAQ |
| `leaderboard/` | Twelve made-up companies ranked by DRR. Every row links to that company's card, and the card shows the same number. Two of them ticked the box |
| `404.html` | This page churned |
| `assets/drr.js` | The model, the card drawing and the leaderboard companies. The generator, the leaderboard and the tests all load it |
| `assets/site.js` | The domain constant, plus the nav and the "Why this exists" footer every page shares |
| `assets/site.css` | All the styles |
| `assets/og.png` | The 1200x630 share image, which is the default card, stamp and strip included |
| `tests/drr.test.mjs` | Node tests for the model and the card |
| `.github/workflows/pages.yml` | Publishes the site to GitHub Pages |
| `.github/workflows/check.yml` | Runs the tests on every PR and push |

There's no build step, no framework, no database and no `package.json`. Nothing on the site sends data anywhere.

## Run it

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` straight from disk works too.

Tests need Node 22 and nothing else:

```sh
node --test
```

They check that a link round trips to the same number, that the AI box gives $0 for every input, that junk in the hash gets clamped, and that every card draws its MADE UP stamp and its strip. One test pins the number for one exact link. If you change the model on purpose, that test fails, and so does every card anyone has already shared, so say so in the PR.

## How the card works

The answers live in the URL after the `#`, so the link is the card. `n` is the name, `v` vibes, `a` the agentic count, `h` hours slept, `p` pivots, `f` the ticked boxes as one letter each, `x=1` is the AI box and `r` is actual revenue. Actual revenue goes on the card as "not material" and never touches the math.

The model is in `compute()` in `assets/drr.js`, and the page explains it in plain sight under "How DRR works". The lever table on the page is built from the same `FLAGS` list the checkboxes come from, so the two can't drift. A flag's letter is what old links store, so never reuse a letter for a different box.

The canvas is 1200x630. The MADE UP stamp, the `$`/`$$`/`$$$`/`$$$$` axis and the yellow "100% made up. Not revenue." strip are drawn into the PNG itself, so a cropped screenshot still reads as a joke.

## Deploy

The site goes on GitHub Pages at https://mergetel.github.io/drr/. In Settings, Pages, set the source to "GitHub Actions". `pages.yml` then publishes on every push to `main`, and only the site files go up. The tests, the workflows and this README stay in the repo.

Every link is relative, and `assets/site.js` works out the site root from its own URL, so the same files work under `/drr/` now and at `/` on a custom domain. `404.html` is the exception, since Pages serves it at whatever path was missing. It works out the root from the hostname instead.

## Set the domain

The address lives in the `window.SITE` line at the top of `assets/site.js`. It's `mergetel.github.io/drr` until a domain is bought. The card's strip prints it, so every PNG carries it.

The `og:image` tags in `index.html` and `leaderboard/index.html` hold the full URL too, because link previews need an absolute one. Change those as well.

To move to a real domain:

1. Point its DNS at GitHub Pages. An apex domain gets `A` or `ALIAS` records, and a subdomain gets a `CNAME` to `mergetel.github.io`.
2. Enter it in Settings, Pages, Custom domain, and tick "Enforce HTTPS" once the certificate is issued.
3. Change `window.SITE` and the two `og:image` URLs.

No `CNAME` file is needed, because an Actions deploy takes the domain from the setting.

If you change how the default card looks, redraw `assets/og.png` too. Open the generator with an empty hash and save the card with Download PNG.

## The footer

Every page ends with a "Who made this" block. It says who John is in a few lines and links to [johnf.build](https://johnf.build), [merge.tel](https://merge.tel) and [Screenery](https://screenery.dev), so anyone who lands on a joke site can find the real projects. The same block is on every mergetel satire site: [bfpi](https://github.com/mergetel/bfpi), [mmr](https://github.com/mergetel/mmr), [stinkslot](https://github.com/mergetel/stinkslot), [gtmgen](https://github.com/mergetel/gtmgen) and this one. Each repo keeps its own copy, so no site depends on another one being up.

The markup is in `assets/site.js`, which draws the footer on every page, 404 included. The CSS is in `assets/site.css`. Both sit between `whois:start` and `whois:end` comments. The block sets no colours of its own. It picks up the site's `--line` and `--muted` variables and its link colour, so it matches whichever palette it lands in.

To change it, edit the block in every repo and keep it identical, one PR per repo. The "Why this exists" text and the parody line above it belong to each site and don't change with it.

## Rules

- **Obviously fake, and the image says so.** Anything people can download or screenshot carries the tell inside the image. The card has its stamp and strip, and the leaderboard has a yellow MADE UP strip inside the panel.
- **Mock the genre, never a name.** Every company, founder and quote is made up, and the names are jokes rather than plausible brands. If one turns out to belong to something real, rename it in `COMPANIES` in `assets/drr.js` and in the quotes on `index.html`.
- **No email capture, no tracking.** Nothing on the site collects an address or sends a request anywhere. The inputs stay in the link.
- **Two voices.** The parody copy is straight-faced pitch-deck voice on purpose. The "Why this exists" footer is John speaking in the first person, and it points at merge.tel.

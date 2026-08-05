# Flow Fusion UAE Website — V9

V9 is the final mobile-readiness revision of the six-page static website.

## Main V9 corrections

- Reveal effects no longer hide content or create blank sections.
- All responsive images load reliably with stable background surfaces.
- Mobile functional labels and footer text use a readable minimum size.
- Footer, filters, service index, consent control and carousel controls have practical touch targets.
- The mobile footer is compact and retains the copyright as one text element.
- Horizontal rails use native snap behavior and visible swipe cues.
- Services retain all six disciplines while secondary technical detail collapses on mobile.
- Mobile map uses a local branded preview and an external Google Maps action, avoiding blank iframe areas.
- Decorative effects are contained and reduced on small screens.
- Portrait and short-landscape layouts are specifically controlled.

## Pages

- `index.html`
- `portfolio.html`
- `about.html`
- `services.html`
- `contact.html`
- `location.html`

## Preview locally

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Items requiring final business information

- Exact office address and Google Maps pin
- Confirmed business hours
- Production form backend
- Verified project descriptions and genuine project photography


## V10 autoplay update

- Home hero changes every 3 seconds.
- Home project focus changes every 3 seconds.
- Portfolio featured projects change every 3 seconds.
- Customer strategy stages change every 3 seconds.
- Desktop service, capability and facility rails advance automatically every 3 seconds.
- Multi-image Services visuals crossfade automatically every 3 seconds.
- Single-image technical visuals use a visible 3-second zoom/pan cycle.
- CSS and JavaScript URLs include a V10 cache-busting query so browsers load the new timings immediately.

### Important V10 browser note
The stylesheet and script include `?v=10` cache-busting parameters. When replacing an older version on a server, upload the complete folder and refresh the browser once; the revised assets should then load without the previous autoplay delay.

## V10.1 Selected Work centering patch

The Home-page Selected Work carousel now opens with the second project centered, with the preceding and following projects visible at the left and right edges. Seamless inert edge clones prevent a blank side when autoplay loops.

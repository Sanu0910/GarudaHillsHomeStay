# Garuda Hills Homestay

Website for Garuda Hills Homestay & scooty rental, Pothamedu, Munnar, Kerala.

Static site, no build step and no external libraries. Open `index.html` or serve the folder:

```sh
python3 -m http.server 8000
```

## Before going live
- Put the host's WhatsApp number in `CONFIG.whatsapp` at the top of `script.js` (digits only, e.g. `919876543210`).
- Add real room, house and scooty photos to `assets/photos/` and update the `src`/`--img` paths in `index.html`.
- Confirm the scooty rental terms (rates, deposit, licence) and the attraction distances.

Deploys as-is to GitHub Pages, Netlify or Vercel.

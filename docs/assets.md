# Assets

## Photos

All photos are from Unsplash under the [Unsplash License](https://unsplash.com/license) (free; none are Unsplash+). They were downloaded with a 2000px long edge, compressed as JPEG, and are served with `next/image` from `public/images/`. Photographers are credited on `/credits` (linked from the footer) and in each photo's caption on the home page.

| File | Unsplash page | Photographer | Used on |
|-|-|-|-|
| `public/images/origin-coffee-harvest.jpg` | https://unsplash.com/photos/farmer-holding-bucket-of-ripe-coffee-cherries-we5u09a0AxA | Candes J ([@candesjaramillo](https://unsplash.com/@candesjaramillo)) | Home, "How custody moves", step 1 (Register at origin); `/credits` |
| `public/images/handoff-loading-dock.jpg` | https://unsplash.com/photos/man-carrying-box-using-fork-liftr-GAdkOpqbTfo | Elevate ([@elevatebeer](https://unsplash.com/@elevatebeer)) | Home, "How custody moves", step 2 (Hand off with two signatures); `/credits` |
| `public/images/lot-marks-sacks.jpg` | https://unsplash.com/photos/several-sacks-2NiVOHcIx4I | Diego Catto ([@diegocatto](https://unsplash.com/@diegocatto)) | Home, "How custody moves", step 3 (Verify anywhere); `/credits` |

## Built in code (no image files)

- Logo mark and wordmark: `src/components/site/brand.tsx`; favicon: `src/app/icon.svg`.
- Open Graph image (per locale): `src/app/[locale]/opengraph-image.tsx` (`next/og`).
- Batch passport / shipping manifest, route rail and custody stamps: `src/components/passport/`.
- Temperature trace chart (hand-drawn SVG, no chart library): `src/components/passport/temp-chart.tsx`.
- Scannable QR labels (`uqr`): `src/components/passport/qr-code.tsx`, `label-card.tsx`.
- Handoff state diagram and record-chain diagram: `src/app/[locale]/(site)/how-it-works/page.tsx`.
- "Built with Monark" credit: the Monark mono standalone mark, inlined from `brand-refs/.../logo-mono-dark-standalone.svg` (footer only).

## Icons

`lucide-react` throughout.

import dock from "../../public/images/handoff-loading-dock.jpg"
import harvest from "../../public/images/origin-coffee-harvest.jpg"
import sacks from "../../public/images/lot-marks-sacks.jpg"

/** Every photo on the site (Unsplash License). Mirrors docs/assets.md. */
export const PHOTOS = {
  harvest: {
    src: harvest,
    name: "Candes J",
    profile: "https://unsplash.com/@candesjaramillo",
    page: "https://unsplash.com/photos/farmer-holding-bucket-of-ripe-coffee-cherries-we5u09a0AxA",
    where: { en: "step 1 (Register at origin)", fr: "étape 1 (Enregistrer à l'origine)" },
  },
  dock: {
    src: dock,
    name: "Elevate",
    profile: "https://unsplash.com/@elevatebeer",
    page: "https://unsplash.com/photos/man-carrying-box-using-fork-liftr-GAdkOpqbTfo",
    where: { en: "step 2 (Hand off with two signatures)", fr: "étape 2 (Passer la main à deux signatures)" },
  },
  sacks: {
    src: sacks,
    name: "Diego Catto",
    profile: "https://unsplash.com/@diegocatto",
    page: "https://unsplash.com/photos/several-sacks-2NiVOHcIx4I",
    where: { en: "step 3 (Verify anywhere)", fr: "étape 3 (Vérifier partout)" },
  },
} as const

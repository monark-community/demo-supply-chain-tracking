# ChainProof site plan

ChainProof is an independent product incubated by Monark (`monark-branded: false`). This plan describes the Next.js rebuild of the demo that lives at https://chainproof.monark.io/, and it is kept in sync with what ships. The authoritative product description is https://www.monark.io/en/project/supply-chain-tracking.

Decisions made while working unattended are marked **Decision:** so the owner can revisit them.

---

## 1. Product brief

**Target users.**

- *Primary:* the quality or compliance lead at a brand that has to prove where a batch has been: a specialty coffee importer, a vaccine maker shipping at 2–8 °C, a mill selling certified structural timber. They answer to auditors, regulators and big customers.
- *Secondary:* the partners who touch the batch (the cooperative, the carrier, the distributor, the pharmacy, the site foreman). They sign what they hand over and what they receive.
- *Tertiary:* whoever holds the finished product (a shopper, a pharmacist, a building inspector) and wants to check the label in ten seconds.

**Core job to be done.** "When someone questions a batch, let me show exactly who held it, when, and in what condition, in a record none of us could have quietly edited."

**Domain concepts.**

| Concept | Meaning in ChainProof |
|-|-|
| Batch (lot) | A physical quantity registered once by its producer, with a lot code such as `HU-2611`. |
| Custodian | The organization physically responsible for the batch right now. Exactly one at a time. |
| Handoff | A custody transfer. The sender signs what leaves (count, seal number); the receiver signs what arrives. Custody only moves when both have signed. |
| Exception | A receiver can accept with an exception (count short, seal broken, temperature flag) so the discrepancy is on the record, signed by the party who saw it. |
| Refusal | The receiver refuses; custody stays with the sender and the refusal is on the record. |
| Checkpoint | A signed note from the custodian: inspection, customs release, storage move. |
| Sealed readings | IoT logger readings (temperature) hashed into one root and anchored on-chain. Readings outside the batch's range create an **excursion flag** that cannot be removed, only answered. |
| Record chain | Every record carries the hash of the one before it, so changing any past record breaks every hash after it. |
| Passport | The public page a label's QR code opens: origin, route, custody stamps, flags and a live integrity check. |

**What the Lovable version got wrong or left out.**

- Nothing could actually be done. "Add New Product" was a dead button, analytics said "Coming soon", and the QR scanner was a static page. No flow could be completed.
- A role dropdown only changed the greeting. There were no parties with identities, so the central idea (several independent organizations signing one record) never appeared.
- Custody was a one-sided list of "Completed" stages. There was no notion of a handoff needing the receiver's agreement, no disputes, no refusals, no failure states.
- IoT sensors, which the project documentation calls out, were absent. So was any tamper check: the site claimed "immutable" but never showed what immutability buys you.
- Invented vanity stats ("1,234 products, +12%"), fake truncated hashes, blue-to-purple gradients and a rotating stock-photo hero.
- English only, no dark mode, no accessibility work.

## 2. Value proposition

**For brands that must prove where a batch has been, ChainProof records every handoff as a record signed by both the sender and the receiver, so provenance holds up in front of an auditor or a shopper without anyone having to trust anyone else's spreadsheet.**

Supporting benefits (outcomes, not features):

1. **Settle a dispute in minutes, not weeks.** Who held the batch, when, and what they counted is co-signed by both sides of every handoff.
2. **Catch a cold-chain break before it reaches a shelf.** Temperature excursions are pinned to the batch and travel with it to every next receiver.
3. **Earn trust at the point of sale.** Anyone who scans the label sees the journey and a live integrity check, with no app and no account.

## 3. Hero

- **Headline (EN):** Every handoff, signed by both hands.
- **Headline (FR):** Chaque passation, signée des deux mains.
- **Subheadline (EN):** Sender and receiver both sign every handoff, and sensor readings are sealed on the way. Anyone with the label checks the trip in seconds.
- **Subheadline (FR):** L'expéditeur et le destinataire signent chaque passation, et les relevés sont scellés en route. Avec l'étiquette, on vérifie le trajet en quelques secondes.
- **Primary CTA:** "Open the demo" / « Ouvrir la démo » → `/[locale]/app`.
- **Secondary CTA:** "Check a real label" / « Vérifier une étiquette » → `/[locale]/verify?code=HU-2584`.
- **Hero visual:** product UI built in code, not a photo: the passport of coffee lot `HU-2584` drawn as a shipping manifest. A route rail runs from Pitalito to Montréal; each leg gets a two-part custody stamp (sender + receiver) that lands in sequence on load, and the integrity line at the bottom ticks "8 of 8 records match the ledger". It shows the product's single idea (two signatures per handoff) in the first second, and it is the same component the passport page uses, so the hero is honest.

## 4. Page map

All routes live under `/en/…` and `/fr/…`; `/` redirects to the visitor's preferred language (fallback English).

| Route | Purpose | Sections, in order |
|-|-|-|
| `/` | Explain the idea and send people into the demo. | Hero (manifest visual, no eyebrow) · How custody moves (3 steps, with the three documentary photos) · Breaks stay on the record (cold-chain excursion chart) · Built for three kinds of goods (coffee, vaccines, timber, each linking to its live demo batch) · FAQ · Closing CTA |
| `/app` | The ledger workspace (interactive demo). | Wallet gate (connect / reject) → "Acting as" organization · Awaiting your signature (inbox) · In your custody · All batches (filter by status) · Recent network activity |
| `/app/register` | Flow 1: a producer registers a batch and prints its label. | Role gate (producers only) · Form · Sign prompt · Pending / confirmed / failed · Label with QR code |
| `/app/batch/[id]` | Everything about one batch; where flows 2 and 3 happen. | Lot header · Route rail with custody marker · Contextual action panel (hand off / review handoff / seal readings / checkpoint) · Tabs: Custody record · Sensor log · Label |
| `/verify` | Flow 4: what a QR code opens. Public, no wallet. | Scan panel (simulated viewfinder + sample shelf of labels + manual lot code) · Passport · Integrity check · Tamper simulation |
| `/how-it-works` | For the auditor and the developer who need to trust the mechanism. | Records and custody · The handoff protocol (state diagram) · Sealing sensor readings · How a label is verified · What stays private · The record format (typed JSON) |
| `/credits` | Photo credits (required by the asset rules). | Photo list with photographers and Unsplash links |
| `/pricing` | Internal strategy review only. **Never linked, noindex, not in the sitemap.** | Three plans · Usage fee · Rationale |
| 404 | Not-found page in both languages. | Message · links home and to the demo |

**Why `/verify` is its own page:** it is the only page a consumer ever sees. A QR code on a bag of coffee must not land inside a wallet-gated workspace.
**Why `/how-it-works`:** buyers of traceability are auditors and integrators; they need the mechanism (what is signed, what is anchored, what stays off-chain) before they believe the demo.

**Header:** ChainProof logo · How it works · Verify a label · EN/FR switch · theme toggle · "Open the demo" (primary). A compact "Demo" chip sits before the EN/FR switch (desktop) and "Demo · simulated data" is in the footer and the mobile menu; nothing else on marketing pages. Inside `/app` the header swaps the CTA for the acting-as wallet (which also holds "Demo controls") and the network badge. Mobile: logo + menu button opening a full-height sheet.

**Footer:** one-line description · How it works · Verify a label · Open the demo · Credits · Project documentation (monark.io) · Source code (GitHub) · "Demo · simulated data" · "Built with Monark" credit.

## 5. Feature highlights

| Feature | User benefit | Where it appears | Proven by |
|-|-|-|-|
| Two-signature handoffs | Nobody can claim they delivered what the receiver never signed for. | Hero stamps, home step 2, batch page action panel | Flow 2 |
| Exceptions and refusals | Discrepancies are recorded by the party who saw them, at the moment they saw them. | Batch page review dialog, custody record | Flow 2 (and 3) |
| Sealed sensor readings with excursion flags | A temperature break follows the batch to every next receiver and cannot be deleted. | Home "Breaks stay on the record", batch Sensor log tab | Flow 3 |
| Label passport with integrity check | A shopper or inspector checks the whole journey in seconds and sees immediately if a copy was altered. | Hero, `/verify` | Flow 4 |
| Batch registration with printable label | The record starts at origin, with the producer's signature, before the goods move. | `/app/register` | Flow 1 |

## 6. Key flows

All wallet actions go through a simulated signature prompt (Confirm / Reject) and a simulated transaction with 1.2–2.6 s latency. "Demo controls" (in the app header) can force the next transaction to fail, and hold "Reset demo".

### Flow 0: connect (prerequisite of flows 1–3)
1. `/app` shows a gate: "Connect a demo wallet".
2. A prompt lists the demo organizations grouped by role. Pick one and Confirm, or Reject.
3. *Rejected:* inline alert "Connection cancelled. Nothing was shared." with a retry.
4. *Connected:* the ledger overview for that organization. The acting-as menu switches organization at any time (it is the same as switching wallet accounts).

### Flow 1: register a batch (producer)
1. Acting as a producer, open **Register a batch**. Non-producers see "Only producers can register a batch" with a one-click switch to a producer.
2. Pick a template (green coffee, vaccine, glulam beams) or fill in: product, quantity + unit, origin, production date, certifications, planned route (next custodians), optional cold-chain range.
3. *Validation errors* inline on each field.
4. **Sign and register** → signature prompt showing the record hash. *Rejected:* "You didn't sign. Nothing was registered."
5. *Pending:* tx-status "Anchoring record…" with the transaction hash.
6. *Failed:* "The network didn't confirm the transaction. Nothing was registered." Retry keeps the form.
7. *Confirmed:* the label: lot code, product, QR code (real, scannable, points to `/verify?code=…`), block number. Actions: Print label, Open batch.

### Flow 2: hand off custody (two signatures)
1. Acting as **Fleuve Logistique**, open `HU-2611` (275 bags in Montréal). **Hand off** → dialog: receiver (next on the route), bag count, seal number, note.
2. Sign → pending → confirmed. The route rail shows a dashed "awaiting receiver" leg; the sender can **Cancel handoff** while it waits.
3. Switch to **Torréfaction Maisonneuve**: the overview's "Awaiting your signature" lists `HU-2611`. **Review handoff** shows what the sender declared; the receiver enters the count received and whether the seal matches.
4. Choose **Accept**, **Accept with exception** (count short, seal broken or a note; required when counts differ), or **Refuse** (reason required).
5. Sign → pending → *confirmed:* the custody stamp lands on the leg and custody moves (or, on refusal, stays with the sender and a red "Refused" stamp is recorded). *Failed:* nothing changes; the handoff is still waiting.

### Flow 3: seal sensor readings (cold chain)
1. Acting as **Froid Nord Transport**, open vaccine lot `NV-0417` (2–8 °C). The action panel says "Logger LG-2207 has 36 unsealed readings".
2. **Review readings** shows the temperature trace against the 2–8 °C band. One stretch peaks at 9.3 °C and stays above 8 °C for 30 minutes; it is shaded and labelled.
3. **Seal readings** → sign → pending → *confirmed:* the readings' root hash is anchored, and an **Excursion** flag is added to the record: "9.3 °C peak, 30 min outside 2–8 °C".
4. The flag is permanent: the batch shows it everywhere, and when Froid Nord hands off to **Pharmacie du Plateau**, the receiver's review dialog shows the flag and pre-selects "Accept with exception".
5. *Failed:* readings stay unsealed; retry.

### Flow 4: verify a label (public, no wallet)
1. `/verify`: a viewfinder with a slow scan line and a "shelf" of sample labels (coffee, vaccine, timber, and one label whose code is not on the ledger). Or type a lot code.
2. *Loading:* "Reading the ledger…".
3. *Found:* the passport (origin, route with custody stamps, flags) and the integrity check that re-computes each record hash and ticks through them: "Verified: 8 of 8 records match the ledger".
4. **Simulate a tampered copy** changes one record in the local copy (the delivered bag count): the check turns that record and every one after it red: "This copy doesn't match the ledger. Record 4 was changed after it was signed."
5. *Not found:* "No batch with code XX-0000 is on the ledger. Treat this label as suspect." *Malformed code:* "That doesn't look like a lot code (e.g. HU-2584)."

## 7. Content (EN / FR)

Tone: plain, exact and calm, like a good shipping manifest. Short declarative sentences, concrete nouns (bags, pallets, seals, degrees), no hype, no "revolutionize". French is written for Québec and France readers alike (e.g. « lot », « passation », « transporteur », « portefeuille »).

### Home

| Section | English | Français |
|-|-|-|
| Headline | Every handoff, signed by both hands. | Chaque passation, signée des deux mains. |
| Sub | (see §3) | (voir §3) |
| CTAs | Open the demo · Check a real label | Ouvrir la démo · Vérifier une étiquette |
| Hero caption | Lot HU-2584 · Live passport from the demo ledger | Lot HU-2584 · Passeport réel tiré du registre de démo |
| Steps title | How custody moves | Comment la garde circule |
| Step 1 | **Register at origin.** The producer signs the lot into existence (quantity, origin, certifications) and prints its label. | **Enregistrer à l'origine.** Le producteur crée le lot en le signant (quantité, origine, certifications) et imprime son étiquette. |
| Step 2 | **Hand off with two signatures.** The sender declares the count and seal. The receiver checks them and signs, or records an exception, or refuses. | **Passer la main à deux signatures.** L'expéditeur déclare le compte et le scellé. Le destinataire vérifie et signe, note un écart ou refuse. |
| Step 3 | **Verify anywhere.** The label's code opens the passport and re-checks every record against the ledger. | **Vérifier partout.** Le code de l'étiquette ouvre le passeport et revérifie chaque entrée dans le registre. |
| Breaks title | Breaks stay on the record. | Les écarts restent au registre. |
| Breaks body | Out-of-range readings become a flag that follows the batch. It can be answered, never deleted. | Un relevé hors plage devient un signalement qui suit le lot. On peut y répondre, jamais l'effacer. |
| Breaks CTA | Seal a logger in the demo | Sceller un enregistreur dans la démo |
| Goods title | Built for goods that have to prove themselves | Pour les marchandises qui doivent faire leurs preuves |
| Coffee | **Specialty coffee.** Tie a roaster's bag to the cooperative and the harvest behind it. → Follow lot HU-2611 | **Café de spécialité.** Reliez le sac du torréfacteur à la coopérative et à la récolte. → Suivre le lot HU-2611 |
| Vaccines | **Vaccines and biologics.** Prove the 2–8 °C chain held, or show exactly where it didn't. → Follow lot NV-0417 | **Vaccins et produits biologiques.** Prouvez que la chaîne 2–8 °C a tenu, ou montrez exactement où elle a cédé. → Suivre le lot NV-0417 |
| Timber | **Structural timber.** Keep the mill certificate attached to the beams all the way to the site. → Follow lot SB-0932 | **Bois de structure.** Gardez le certificat d'usine attaché aux poutres jusqu'au chantier. → Suivre le lot SB-0932 |
| FAQ title | Questions | Questions |
| FAQ 1 | *Does every partner need a crypto wallet?* Each organization signs with a key, but it can live in the ChainProof app like any login. Nobody handles tokens. | *Chaque partenaire a-t-il besoin d'un portefeuille crypto?* Chaque organisation signe avec une clé, mais elle peut vivre dans l'application comme n'importe quel identifiant. Personne ne manipule de jetons. |
| FAQ 2 | *What is actually stored on-chain?* Hashes, signatures and who holds custody. Documents, photos and raw sensor readings stay with the parties; only their fingerprints are anchored. | *Qu'est-ce qui est réellement inscrit on-chain?* Des empreintes, des signatures et le nom du gardien. Les documents, photos et relevés bruts restent chez les parties; seules leurs empreintes sont ancrées. |
| FAQ 3 | *What if someone signs something false?* A signature doesn't make a claim true; it makes it attributable. The receiver's own count and the sealed readings are there to contradict a false declaration. | *Et si quelqu'un signe une fausse déclaration?* Une signature ne rend pas une affirmation vraie, elle la rend attribuable. Le compte du destinataire et les relevés scellés sont là pour la contredire. |
| FAQ 4 | *Can a flag be removed?* No. A party can add a response (a lab result, a disposition), and both stay on the record. | *Peut-on retirer un signalement?* Non. Une partie peut y répondre (résultat de labo, décision) et les deux restent au registre. |
| FAQ 5 | *Is this demo on a real blockchain?* No. Signatures, transactions and sensors are simulated in your browser. Nothing leaves your device. | *Cette démo tourne-t-elle sur une vraie chaîne?* Non. Signatures, transactions et capteurs sont simulés dans votre navigateur. Rien ne quitte votre appareil. |
| Closing | **Walk a batch from farm to shelf.** Four flows, ten organizations, about five minutes. [Open the demo] | **Suivez un lot de la ferme au comptoir.** Quatre parcours, dix organisations, environ cinq minutes. [Ouvrir la démo] |

### Demo app (selected strings; all live in the dictionaries)

| Key | English | Français |
|-|-|-|
| Gate title | Connect a demo wallet to start signing | Connectez un portefeuille de démo pour signer |
| Gate body | Each organization in the network signs with its own key. Pick one to act as; you can switch at any time. | Chaque organisation du réseau signe avec sa propre clé. Choisissez celle que vous incarnez; vous pourrez changer en tout temps. |
| Connect rejected | Connection cancelled. Nothing was shared. | Connexion annulée. Rien n'a été partagé. |
| Inbox title | Awaiting your signature | En attente de votre signature |
| Inbox empty | Nothing to sign. Handoffs sent to you will appear here. | Rien à signer. Les passations qui vous sont adressées apparaîtront ici. |
| Custody title | In your custody | Sous votre garde |
| Custody empty | You don't hold any batch right now. | Vous n'avez aucun lot sous votre garde pour l'instant. |
| All batches empty (filter) | No batch matches this filter. | Aucun lot ne correspond à ce filtre. |
| Sign prompt title | Signature request | Demande de signature |
| Pending | Anchoring record… | Ancrage de l'entrée… |
| Confirmed | Confirmed in block {block}. | Confirmé au bloc {block}. |
| Rejected signature | You didn't sign. Nothing was recorded. | Vous n'avez pas signé. Rien n'a été inscrit. |
| Failed tx | The network didn't confirm the transaction. Nothing was recorded; you can try again. | Le réseau n'a pas confirmé la transaction. Rien n'a été inscrit; vous pouvez réessayer. |
| Handoff waiting | Waiting for {org} to sign for it. | En attente de la signature de {org}. |
| Exception required | Counts differ, so this can only be accepted with an exception. | Les comptes diffèrent : vous ne pouvez accepter qu'avec un écart. |
| Excursion flag | Excursion: {peak} peak, {minutes} min above {max}. | Écart : pointe à {peak}, {minutes} min au-dessus de {max}. |
| Batch not found | This lot isn't on the demo ledger. It may have been created before a reset. | Ce lot n'est pas dans le registre de démo. Il date peut-être d'avant une réinitialisation. |
| Verify found | Verified: {n} of {n} records match the ledger. | Vérifié : {n} entrées sur {n} concordent avec le registre. |
| Verify tampered | This copy doesn't match the ledger. Record {i} was changed after it was signed. | Cette copie ne concorde pas avec le registre. L'entrée {i} a été modifiée après sa signature. |
| Verify not found | No batch with code {code} is on the ledger. Treat this label as suspect. | Aucun lot portant le code {code} n'est au registre. Considérez cette étiquette comme suspecte. |
| Reset | Reset demo · Every batch, signature and setting goes back to the start. | Réinitialiser la démo · Lots, signatures et réglages reviennent à leur état initial. |
| Storage error | Your browser blocked local storage, so the demo will forget its state when you leave. | Votre navigateur bloque le stockage local : la démo oubliera son état à votre départ. |
| 404 | This page isn't on the manifest. · Back home · Open the demo | Cette page ne figure pas au manifeste. · Retour à l'accueil · Ouvrir la démo |

The complete copy lives in `src/i18n/dictionaries/en.ts` and `fr.ts`; the tables above are the reviewed source for the key sections.

## 8. Aesthetics

**Concept: "Manifest-grade, stamped, legible."**

The people who buy and use this work in warehouses, labs and loading docks. The artifacts they trust are physical: shipping manifests, lot stencils on burlap, hi-vis tape, rubber stamps, the yellow of a forklift. ChainProof borrows that world instead of the usual blockchain imagery. Paper-coloured surfaces and ink type make records feel like documents you could file. One loud colour, safety yellow, is reserved for what matters right now: the current custodian, the action waiting for you, the stamp that just landed. Monospace lot codes and hashes look like stencils and are easy to read aloud over the phone.

**Palette** (overrides the registry theme variables; ratios computed with the WCAG formula, all text pairs ≥ 4.5:1, UI boundaries ≥ 3:1):

| Role | Light | Dark |
|-|-|-|
| `background` | `#F3F1EA` manifest paper | `#111214` ink |
| `foreground` | `#15171A` (15.9:1 on background) | `#ECE9E0` (15.4:1) |
| `card` | `#FBFAF6` (foreground 17.2:1) | `#1A1B1E` (foreground 14.2:1) |
| `primary` | `#15171A` ink | `#F5C400` safety yellow |
| `primary-foreground` | `#F3F1EA` (15.9:1) | `#111214` (11.4:1) |
| `muted` | `#E7E4DA` | `#25272B` |
| `muted-foreground` | `#595C62` (5.9:1 on bg, 5.3:1 on muted, 6.4:1 on card) | `#A6A59E` (7.6:1 on bg, 6.1:1 on muted, 7.0:1 on card) |
| `accent` | `#F5C400` safety yellow | `#F5C400` |
| `accent-foreground` | `#15171A` (10.9:1) | `#111214` (11.4:1) |
| `border` | `#D6D1C3` dividers (decorative); inputs use `#8C877A` (3.2:1) | `#2E3035` dividers; inputs `#6B6D72` (3.6:1) |
| `ring` | `#15171A` (15.9:1) | `#F5C400` (11.4:1) |
| `destructive` | `#B42318` (5.8:1 on bg; white on it 6.6:1) | `#F28B7F` (7.8:1; ink on it 7.8:1) |
| `success` (extra) | `#1D6A41` (5.8:1) | `#6FCF97` (9.9:1) |
| `warning` (extra) | `#855400` (5.7:1); on `#F8E6B0` chip `#6B4300` (7.0:1) | `#F2B84B` (10.5:1) |
| `chart-1` | `#1D6A41` green (6.3:1 on card) | `#6FCF97` (9.1:1) |
| `chart-2` | `#B42318` red (6.3:1) | `#F28B7F` (7.2:1) |
| `chart-3` | `#8F6B00` ochre (4.7:1) | `#F5C400` (10.5:1) |
| `chart-4` | `#3E5870` slate (7.1:1) | `#8FB3D1` (7.8:1) |
| `chart-5` | `#6A6D73` grey (5.0:1) | `#A6A59E` (7.0:1) |

Yellow is never used for text on paper (it fails contrast); on light surfaces it is always a fill under ink text.

**Type** (two families via `next/font/google`):

- **Archivo** (variable, width axis): display headings at weight 800 and width 72 (condensed, like stencilled crate lettering); body at 400/500, width 100. Uppercase labels at 600, 0.08em tracking, 12px.
- **JetBrains Mono**: lot codes, hashes, block numbers, counts, temperatures. Tabular figures.
- Scale (px): 12 · 14 · 16 · 18 · 22 · 28 · 36 · 48 · 64 (hero, desktop). Body 16/1.6.

**Logo.** A mark made of four scan-frame corners around a solid yellow square (the sealed lot, framed by a scanner), next to the wordmark "ChainProof" in condensed Archivo 800. SVG, in `src/components/site/brand.tsx`; favicon `src/app/icon.svg` is the mark alone.

**Shape.** Radius 4px (labels and tags have square-ish corners, not pills). 1px borders everywhere, plus 2px ink rules to separate manifest sections. Depth comes from borders and paper tones, not blurred shadows; the only shadow is a hard 3px offset on the active stamp and dialogs. Motion: 150–250 ms ease-out for state changes; the stamp lands in 380 ms (scale 1.35 → 1, rotate −9° → −4°); route legs draw in 600 ms. Everything respects `prefers-reduced-motion`.

**Imagery.** Documentary photos in natural, warm light: hands, sacks, a loading dock. No staged smiling teams, no glowing globes. Photos sit in hard rectangular frames with a mono caption strip, like attachments pinned to a manifest ("ATTACHMENT B · Lot marks"). Diagrams are line drawings in ink with yellow for the active element.

**Signature moments.**

1. **The two-part stamp.** When a receiver signs, a square stamp with both organizations' codes and the block number lands on the route leg with a slight rotation, and the yellow custody marker slides to the next node.
2. **The integrity tick.** On a passport, each record's hash re-computes one by one and ticks green. Simulate tampering and the break propagates: the altered record and every one after it turn red, visibly showing why a record chain catches edits.
3. **The flag that won't leave.** Sealing a logger draws the trace against the allowed band; the excursion is shaded, pinned with a flag, and that flag reappears in the next receiver's handoff dialog.

**Deliberately avoided.** Blue/purple "AI gradients", glass, neon, glowing cubes and chains, world maps with arcing light trails (the cliché of every supply chain deck), pill buttons and large soft-shadowed cards (the default shadcn look), and any use of orange as a primary (Monark's colour). The single-accent rule (yellow) keeps the page calm and makes "your turn" impossible to miss.

## 9. Assets

**Photos** (Unsplash, free license; details and credits in `docs/assets.md` and on `/credits`):

| File | Purpose | Placement |
|-|-|-|
| `public/images/origin-coffee-harvest.jpg` | People and origin: a picker's bucket of ripe cherries. | Home, step 1 ("Register at origin") |
| `public/images/handoff-loading-dock.jpg` | The handoff moment: a forklift at a trailer door. | Home, step 2 ("Hand off with two signatures") |
| `public/images/lot-marks-sacks.jpg` | Stencilled lot marks on green-coffee sacks, the physical ancestor of a lot code. | Home, step 3 ("Verify anywhere") |

**Built in code:** manifest passport (hero and `/verify`), route rail with custody stamps, temperature trace chart (hand-drawn SVG, no chart library), handoff state diagram and record-chain diagram on `/how-it-works`, QR labels (`uqr`), Open Graph image (`next/og`), logo and favicon.

**Icons:** `lucide-react` (package, truck, thermometer, stamp, scan-line, shield-check, triangle-alert…).

## 10. Pricing strategy

**Model: brand-pays SaaS with free partner seats and a small per-event fee.**

The organization that benefits most (the brand whose name is on the label and who carries recall and compliance risk) pays. Every other partner signs for free, because the network is only as good as its least-willing carrier; charging a small cooperative or trucker would kill adoption.

| Plan | Price | For |
|-|-|-|
| **Pilot** | Free | One product line, up to 3 partner organizations, 500 records a month, public passports. Enough to run one real lane end to end. |
| **Network** | US$490 / month per brand | Unlimited partners (free seats), 25,000 records a month, IoT logger sealing, custom label domain, CSV/EPCIS export. |
| **Regulated** | From US$2,400 / month | Audit exports for pharma serialization rules, SSO, private anchoring network, dedicated support, SLA. |
| **Overage** | US$0.004 per record | Records are batched into one anchoring transaction, so the fee is predictable and tiny next to the cost of one disputed shipment. |

Why these numbers: a single rejected pallet of vaccine or a disputed container of specialty coffee costs thousands; US$490 is below a mid-size importer's monthly spend on courier documents. The free Pilot lets a quality lead prove value on one lane without procurement.

`/pricing` exists as a designed page (`/en/pricing`, `/fr/pricing`) for internal review only: never linked, `robots: { index: false, follow: false }`, excluded from `sitemap.xml`. No other page mentions prices.

## 11. Out of scope

- No real chain, wallet signing, backend or accounts. Everything is simulated in the browser and stored in `localStorage`.
- No real camera scanning: `/verify` simulates the viewfinder. The printed QR codes are real and resolve to `/verify?code=…` on this site.
- No geographic map tiles; routes are schematic rails (cheaper, clearer, no API keys).
- No document uploads, recalls, GS1 EPCIS import/export or ERP integrations (mentioned on `/how-it-works` as the integration surface, not built).
- No token, fee or payment of any kind in the demo. ChainProof moves custody, not value, so the "testnet · not financial advice" notice does not apply; the "Demo · simulated data" notice does, everywhere.

## 12. Restraint pass (owner feedback, applied before shipping)

The owner asked every site to carry less text ("Restraint" rules, brand guidelines §8 and §11). What changed from the first build:

- **Home:** removed the eyebrow and the before/after comparison section (it explained what the hero manifest already shows). Five sections remain between hero and footer: How custody moves, Breaks stay on the record, Built for three kinds of goods, FAQ (5 questions, home only), closing CTA. Hero subline cut from 38 to 24 words; the cold-chain section is one line.
- **Disclaimers:** "Demo · simulated data" appears once in the footer and as a small "Demo" chip in the header (and in the mobile menu). The long demo notice line was removed from the hero, the footer and the wallet gate. The sign prompt says "Signing is free in this demo. No funds move." once per transaction.
- **App:** the "Try this" guide is a collapsed disclosure instead of a permanent panel; the register page has no intro paragraph, no lot-code hint and no route hint; the unsealed-logger warning is a title only; the seal dialog description is one short line.
- **Toasts:** the "handoff waiting for you" toast on switching organization was removed (it covered the review dialog on phones); the inbox count already says it. The only toast left is "Demo reset".

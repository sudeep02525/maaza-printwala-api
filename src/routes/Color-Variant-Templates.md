# Templates with working colour variants (Vistaprint-style)

You want: business-card templates shown like Vistaprint — the **card design** with a row of **colour swatches**, and clicking a swatch **changes the card's colour live**. ("color bhi change hota hai")

Your current gallery (`PopularTemplates`) shows a static image + name. The *original* version even had colour swatches — but they were **decorative (no onClick)**. This doc is how to make them **real**.

---

## 1. What Vistaprint does

Each template card shows:
- the **design** (the actual card, front),
- a row of **colour swatches** (usually ~4),
- clicking a swatch **recolours the card preview instantly** (accent/background colours change),
- then "Customize" opens the editor with that colour applied.

So a "template" isn't just one image — it's a **design + a set of colour schemes**.

---

## 2. The key idea: the design must have *colour tokens*

For the colour to change, the design can't be a flat photo — its coloured parts must be **data**, so a swatch can change them.

Think of the design as a layout where the colours are placeholders:

```
background: {{bg}}
accent bar:  {{accent}}
heading text: {{text}}
```

A **swatch** is just a set of values for those tokens:

```js
palette = [
  { name: 'Blue',   bg: '#ffffff', accent: '#1E50FF', text: '#0f172a' },
  { name: 'Red',    bg: '#ffffff', accent: '#dc2626', text: '#111827' },
  { name: 'Black',  bg: '#111111', accent: '#c8a24a', text: '#ffffff' },
  { name: 'Green',  bg: '#ffffff', accent: '#059669', text: '#064e3b' },
]
```

Click a swatch → set the tokens → the card **recolours live**. That's exactly the Vistaprint behaviour, and it's the same mechanism the editor needs.

---

## 3. Two ways to build it

**Option A — Pre-rendered images (simplest, quick).**
Each template ships with **one image per colour** (e.g. `card-minimal-blue.png`, `card-minimal-red.png`, …). The swatch just swaps which image is shown.
- ✅ Very easy, no rendering engine.
- ❌ You must export N images per template (4 colours × 10 templates = 40 images), and it doesn't feed the editor.

**Option B — Live recolour from tokens (recommended).**
Store the design as **SVG (or Fabric canvas JSON) with colour tokens** + a `palette` array. The gallery renders the SVG and the swatches; a swatch click updates the tokens → instant recolour.
- ✅ One design per template (not N images); infinite colours.
- ✅ The *same* design + tokens power the **editor** (so "customize" is consistent).
- ✅ Lightweight and crisp.
- Needs: an SVG/JSON design format + a small renderer.

**Recommendation: Option B.** It matches Vistaprint and avoids duplicating images. (You can start with A to ship fast, then move to B.)

---

## 4. Data model changes (`Template`)

Add to the `Template` model:
- **`designSvg`** (or `canvasJson`) — the design as SVG/canvas with colour tokens.
- **`palette`** — an array of colour schemes: `[{ name, bg, accent, text, ... }]`.
- (keep `thumbnail`/`previewFront`/`previewBack` for a fallback image.)

So a template = **design + palette + editable fields + product**.

---

## 5. Gallery UI (the Vistaprint look)

Each card in `PopularTemplates`:

```
┌───────────────────────────┐
│                           │
│     [ card design ]       │   ← the design (SVG), aspect 1.75:1, object-contain
│                           │
├───────────────────────────┤
│ ● ● ● ●   Template Name    │   ← colour swatches + name
│            6 editable fields│
└───────────────────────────┘
```

- The design box: **correct aspect ratio (1.75:1)** + **`object-contain`** so the whole card shows (fixes the current cropping).
- Below it: a **swatch row** (4 circles). The **active swatch** gets a ring.
- **Clicking a swatch → recolour the design in place** (no navigation).
- Clicking the card → design studio with that template **and the chosen colour**.

---

## 6. Wiring it through

1. **Gallery:** render the design + swatches; swatch click recolours (local state).
2. **Design studio:** open with `?templateId=…&palette=…` (or pass the chosen scheme); the editor loads the design with that colour applied.
3. **Cart:** when added, the item carries `templateId` + the chosen colours/`customFields` — the cart already supports TEMPLATE items with custom fields.
4. **Admin:** when creating a template, define the **palette** (the colour schemes) + the design (SVG/canvas).

---

## 7. Build list

1. **`Template` model:** add `palette[]` + `designSvg` (or `canvasJson`).
2. **Gallery card:** fix the image (`object-contain` + `aspect-[1.75/1]`), add a **swatch row**, make swatches **recolour the design**.
3. **Design source:** store each template's design as SVG/canvas with colour tokens (or, to start, ship N pre-rendered colour images — Option A).
4. **Design studio:** accept the chosen colour and load the design with it.
5. **Admin:** template editor to set the palette + design.
6. (Later) the full editor so the customer can also change text/logo, not just colour.

---

## 8. Quick decision

- **Want it fast, colour only?** → **Option A**: export 4 colour images per template; swatch swaps the image. Minimal code.
- **Want it right (and ready for the editor)?** → **Option B**: SVG/canvas design with a palette; swatches recolour live. More setup, but it's the real Vistaprint model and reuses everything.

Either way, the **gallery card layout** (design at 1.75:1, `object-contain`, swatch row, name) is the same — and that's what makes it look like Vistaprint.

---

*Based on your screenshot (templates + 4 colour swatches each) + the current `PopularTemplates`/`Template` code.*

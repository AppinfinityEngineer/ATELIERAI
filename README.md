# Atelier AI — ThoughtSnap Labs

Painting planner for traditional painters. Upload a photograph → value studies,
colour families, real pigment mixing recipes, edge hierarchy, drawing guides,
virtual palette with paint estimates, and a printable PDF painting plan.

All image analysis runs client-side (Canvas API). FastAPI only serves static
assets, so the Render free tier handles it.

## Run locally
    pip install -r requirements.txt
    uvicorn main:app --reload
    # open http://localhost:8000

## Deploy to Render
1. Push this folder to a GitHub repo.
2. Render → New → Web Service → connect the repo.
3. Render reads `render.yaml` (or set manually):
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Health check path: `/health`

## Architecture
- `main.py` — FastAPI shell (`/`, `/health`, `/static/*`)
- `static/js/pigments.js` — 25-pigment library, Lab colour math, subtractive
  mixing model, recipe search (1–3 pigments + white), limited palettes
  (Zorn, Apelles, Academic, Portrait, Landscape)
- `static/js/imaging.js` — value engine (2–12 groups + soft transitions,
  notan, histogram), colour engine (Lab k-means with saturation/temperature/
  painterliness controls), edge hierarchy (hard/soft/lost), light map,
  temperature map, saturation map, drawing guides, brush-direction flow field
- `static/js/app.js` — workspace UI, 15 painting modes (Rembrandt,
  Caravaggio, Zorn, Sargent, Grisaille, Verdaccio…), click-to-mix panel,
  master palette (toggle owned pigments), virtual palette with paint-usage
  estimates, PNG export + multi-page PDF painting plan (jsPDF)

## Roadmap hooks
Modes are data-driven (`MODES` in app.js) — acrylic/watercolour become new
preprocessing profiles. Pigment library is a flat array — brand packs and
custom libraries slot in without engine changes.

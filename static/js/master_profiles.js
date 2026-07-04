// Atelier AI - master painting profiles.
import { rgbToLab } from './pigments.js';
import { labToRgb } from './imaging.js';

export const MASTER_PROFILES = {
  academic: { title:'Academic Realism', era:'19th century atelier', summary:'Balanced modelling, clean halftones, controlled chroma, accurate drawing and polished finish.', values:'7-9 value families; do not over-crush shadows.', edges:'Hardest accents around the focal feature; soft cheek, hair and background transitions.', palette:'Titanium White, Yellow Ochre, Raw Umber, Burnt Sienna, Ultramarine Blue, Cadmium Red Light.', steps:['Burnt umber drawing','Thin local-colour block-in','Model large light/shadow families','Refine halftones','Reserve sharp accents for the final pass'], ground:[37,31,24], groundBlend:.08, contrast:1.04, chroma:.92, shadowWarm:.04, lightWarm:.02, valueClamp:[5,96], texture:.18 },
  renaissance: { title:'High Renaissance', era:'Leonardo / Raphael logic', summary:'Sfumato transitions, restrained chroma, warm skin, quiet shadows and idealised form.', values:'6-8 value families with gentle midtone transitions.', edges:'Very soft facial planes; hard edges only at silhouettes, eyelids and key drawing accents.', palette:'Lead/Titanium White, Yellow Ochre, Raw Umber, Burnt Umber, Vermilion/Cadmium Red, Ultramarine.', steps:['Warm imprimatura','Accurate contour drawing','Thin umber/value block','Softly glaze colour','Feather transitions with dry brush'], ground:[72,55,36], groundBlend:.16, contrast:.96, chroma:.78, shadowWarm:.12, lightWarm:.03, valueClamp:[10,94], texture:.10, sfumato:.28 },
  baroque: { title:'Baroque', era:'dramatic 17th century studio', summary:'Large shadow masses, theatrical light, warm flesh, deep browns and strong focal contrast.', values:'5-7 value families; big shadow mass first.', edges:'Sharp accents at the lit focal point; shadows merge into broad lost edges.', palette:'Titanium White, Yellow Ochre, Raw Umber, Burnt Umber, Burnt Sienna, Cadmium Red Light, Ultramarine.', steps:['Tone canvas dark warm','Mass shadows as one shape','Place highest light early','Build warm halftones','Glaze dark passages and sharpen final accents'], ground:[45,29,18], groundBlend:.22, contrast:1.22, chroma:.82, shadowWarm:.18, lightWarm:.08, valueClamp:[2,98], texture:.22 },
  dutch: { title:'Dutch Golden Age', era:'Rembrandt school / Vermeer restraint', summary:'Earth pigments, quiet colour, luminous lights and disciplined dark masses.', values:'6-8 grouped values with controlled highlights.', edges:'Lost background edges, crisp jewellery/fabric/eye accents.', palette:'Titanium White, Yellow Ochre, Raw Umber, Burnt Umber, Burnt Sienna, Ultramarine, Ivory Black.', steps:['Warm brown ground','Transparent dark block-in','Opaque lights','Glazed middle notes','Final small highlight accents'], ground:[52,39,26], groundBlend:.20, contrast:1.16, chroma:.70, shadowWarm:.16, lightWarm:.04, valueClamp:[3,96], texture:.18 },
  atelier: { title:'Classical Atelier', era:'modern atelier method', summary:'Drawing-first realism with separated light/shadow families and clean practical mixtures.', values:'7-10 values; group shadow families before detail.', edges:'Hierarchy-led: focal hard edges, form soft edges, background lost edges.', palette:'Titanium White, Yellow Ochre, Burnt Sienna, Raw Umber, Ultramarine Blue, Cadmium Red Light.', steps:['Envelope drawing','Shadow-shape map','Dead-colour block-in','Turn form with halftones','Finish focal accents only'], ground:[42,34,27], groundBlend:.10, contrast:1.06, chroma:.88, shadowWarm:.06, lightWarm:.02, valueClamp:[5,97], texture:.14 },
  allaprima: { title:'Alla Prima', era:'direct painting', summary:'Wet-into-wet, broad colour notes, visible brushwork and fewer mixtures.', values:'5-7 larger value notes; avoid over-modelling.', edges:'Painterly variety; fresh hard notes over broader soft masses.', palette:'Titanium White, Cadmium Yellow Light, Yellow Ochre, Cadmium Red Light, Alizarin Crimson, Ultramarine, Viridian.', steps:['Big colour notes','Paint darks thin','Paint lights thicker','Merge wet edges','Add final calligraphic strokes'], ground:[48,41,32], groundBlend:.12, contrast:1.02, chroma:1.04, shadowWarm:.04, lightWarm:.04, valueClamp:[6,98], texture:.42 },
  sargent: { title:'Sargent', era:'bravura portrait logic', summary:'Economical value masses, confident dark accents, creamy lights and decisive brush placement.', values:'5-7 major value statements; avoid small equal-detail patches.', edges:'Sharp calligraphic accents surrounded by broad soft simplification.', palette:'Titanium White, Yellow Ochre, Cadmium Red Light, Alizarin Crimson, Raw Umber, Ultramarine, Ivory Black.', steps:['Draw with loaded brush','Block large shadow shapes','Place temperature notes','Drag thick lights over form','Stop before overworking'], ground:[40,35,30], groundBlend:.10, contrast:1.12, chroma:.94, shadowWarm:.05, lightWarm:.03, valueClamp:[4,99], texture:.46 },
  sorolla: { title:'Sorolla', era:'sunlit Spanish impression', summary:'High-key light, warm sun, cool shadows, lively chroma and outdoor freshness.', values:'6-8 values but lifted shadows; protect bright light.', edges:'Soft atmospheric backgrounds; crisp sunlit accents.', palette:'Titanium White, Cadmium Yellow Light, Yellow Ochre, Cadmium Red Light, Ultramarine, Cobalt Blue, Viridian.', steps:['High-key block-in','Keep shadows colourful','Paint light thick and warm','Cool reflected notes','Finish with sparkling accents'], ground:[74,63,45], groundBlend:.08, contrast:.96, chroma:1.15, shadowWarm:-.06, lightWarm:.16, valueClamp:[16,100], texture:.36 },
  rembrandt: { title:'Rembrandt', era:'Dutch chiaroscuro', summary:'Deep warm darks, luminous flesh, restrained colour and glowing impasto lights.', values:'4-6 dominant value masses; lights emerge from darkness.', edges:'Most edges disappear into shadow; facial focal accents are sharp and thick.', palette:'Titanium White, Yellow Ochre, Raw Umber, Burnt Umber, Burnt Sienna, Transparent Oxide Red, Ultramarine, Ivory Black.', steps:['Dark warm imprimatura','Transparent shadow masses','Opaque warm flesh lights','Scumble halftones','Final impasto highlights'], ground:[34,22,14], groundBlend:.30, contrast:1.34, chroma:.72, shadowWarm:.24, lightWarm:.10, valueClamp:[1,97], texture:.28 },
  caravaggio: { title:'Caravaggio', era:'tenebrism', summary:'Extreme light-versus-dark structure, simplified colour and a dramatic stage-lit focal point.', values:'3-5 huge value families; shadows must stay unified.', edges:'Knife-sharp light-side accents; almost all background edges lost.', palette:'Titanium White, Yellow Ochre, Raw Umber, Burnt Umber, Burnt Sienna, Cadmium Red Light, Ivory Black.', steps:['Decide the single light source','Mass all darks together','Carve the lit form','Keep background quiet','Add few brilliant accents'], ground:[25,17,12], groundBlend:.34, contrast:1.55, chroma:.68, shadowWarm:.20, lightWarm:.12, valueClamp:[0,99], texture:.20 },
  bouguereau: { title:'Bouguereau', era:'French academic finish', summary:'Silky modelling, accurate anatomy, pearly lights, delicate transitions and polished surfaces.', values:'8-10 subtle value families; no harsh posterisation.', edges:'Soft internal modelling; clean contours and carefully placed accents.', palette:'Titanium White, Naples Yellow, Yellow Ochre, Cadmium Red Light, Alizarin Crimson, Raw Umber, Ultramarine.', steps:['Precise drawing','Smooth dead-colour layer','Thin glazes','Opaque flesh lights','Final polished transitions'], ground:[66,55,43], groundBlend:.10, contrast:.92, chroma:.74, shadowWarm:.08, lightWarm:.05, valueClamp:[12,98], texture:.06, sfumato:.34 },
  velazquez: { title:'Velazquez', era:'Spanish economy', summary:'Muted earth colour, large simple planes, optical brush notes and restrained detail.', values:'5-7 honest values with broad plane simplification.', edges:'Loose outer edges, precise small accents at the focus.', palette:'Titanium White, Yellow Ochre, Raw Sienna, Burnt Umber, Raw Umber, Ultramarine, Ivory Black.', steps:['Thin earth block-in','Large planes first','Muted colour notes','Broken brush accents','Leave secondary areas unresolved'], ground:[50,42,32], groundBlend:.18, contrast:1.12, chroma:.62, shadowWarm:.08, lightWarm:.02, valueClamp:[5,96], texture:.38 },
  grisaille: { title:'Grisaille', era:'monochrome underpainting', summary:'Pure value training with no colour distraction; ideal for drawing and form accuracy.', values:'7-10 value families; focus on form turning.', edges:'Use full edge hierarchy without chroma.', palette:'Titanium White, Raw Umber or Ivory Black.', steps:['Tone the canvas','Draw accurately','Mass shadow','Model form in grey values','Use as finished study or underpainting'], ground:[45,43,40], groundBlend:.10, contrast:1.08, chroma:0, shadowWarm:0, lightWarm:0, valueClamp:[4,96], texture:.12 },
  verdaccio: { title:'Verdaccio', era:'green earth flesh underpainting', summary:'Cool greenish underpainting that supports later warm flesh glazes.', values:'7-9 value families in cool green-grey.', edges:'Soft internal form; keep drawing clear.', palette:'Titanium White, Yellow Ochre, Raw Umber, Viridian or Green Earth, Burnt Sienna.', steps:['Warm/cool ground','Green-grey form modelling','Dry fully','Glaze warm flesh over top','Reclaim highlights opaquely'], ground:[50,54,43], groundBlend:.22, contrast:1.04, chroma:.38, shadowWarm:-.12, lightWarm:-.04, valueClamp:[7,95], texture:.10 },
  zorn: { title:'Zorn Limited Palette', era:'four-colour discipline', summary:'White, yellow ochre, red and black force disciplined temperature and value control.', values:'5-7 value families; colour variety comes from temperature, not tube count.', edges:'Bold economical edges and simple masses.', palette:'Titanium White, Yellow Ochre, Cadmium Red Light, Ivory Black.', steps:['Mix full value string first','Paint shadows thin','Control orange/grey temperature','Reserve clean white mixes','Use black as cool blue substitute'], ground:[54,43,32], groundBlend:.18, contrast:1.10, chroma:.72, shadowWarm:.02, lightWarm:.04, valueClamp:[4,97], texture:.24 }
};

function clamp(v,min=0,max=255){ return Math.max(min, Math.min(max, v)); }
function noise(x,y){ const n=Math.sin(x*12.9898 + y*78.233) * 43758.5453; return n - Math.floor(n); }

export function applyMasterFinish(img, profile){
  if(!profile) return img;
  const d = img.data, w = img.width;
  const [lo,hi] = profile.valueClamp || [0,100];
  const ground = profile.ground || [42,34,27];
  const groundBlend = profile.groundBlend || 0;
  const chroma = profile.chroma ?? 1;
  const contrast = profile.contrast ?? 1;
  const texture = profile.texture || 0;
  const sfumato = profile.sfumato || 0;

  for(let i=0,p=0;i<d.length;i+=4,p++){
    const x = p % w, y = (p / w) | 0;
    let lab = rgbToLab([d[i],d[i+1],d[i+2]]);
    let L = lab[0];
    L = 50 + (L - 50) * contrast;
    L = lo + (hi - lo) * clamp(L,0,100) / 100;
    const shadow = Math.max(0, (45 - L) / 45);
    const light = Math.max(0, (L - 55) / 45);
    lab[1] *= chroma;
    lab[2] *= chroma;
    lab[1] += (profile.shadowWarm || 0) * 18 * shadow + (profile.lightWarm || 0) * 8 * light;
    lab[2] += (profile.shadowWarm || 0) * 30 * shadow + (profile.lightWarm || 0) * 22 * light;
    lab[0] = L;
    let [r,g,b] = labToRgb(lab);
    const gb = groundBlend * (0.35 + 0.75 * (1 - light));
    r = r*(1-gb) + ground[0]*gb;
    g = g*(1-gb) + ground[1]*gb;
    b = b*(1-gb) + ground[2]*gb;
    if(texture){
      const n = (noise(x,y)-0.5) * texture * 18;
      const long = (noise((x/7)|0, (y/3)|0)-0.5) * texture * 10;
      r += n + long; g += n + long; b += n + long;
    }
    if(sfumato){
      const mid = 128;
      r = r*(1-sfumato*0.18) + mid*(sfumato*0.18);
      g = g*(1-sfumato*0.18) + mid*(sfumato*0.18);
      b = b*(1-sfumato*0.18) + mid*(sfumato*0.18);
    }
    d[i]=clamp(Math.round(r)); d[i+1]=clamp(Math.round(g)); d[i+2]=clamp(Math.round(b));
  }
  return img;
}

export function masterNotes(key){
  return MASTER_PROFILES[key] || MASTER_PROFILES.academic;
}

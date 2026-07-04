// Atelier AI — image analysis engines. Everything runs on ImageData.

// ---------- helpers ----------
export function makeCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }

export function fitImage(img, maxDim=1400){
  const s=Math.min(1, maxDim/Math.max(img.width,img.height));
  const w=Math.round(img.width*s), h=Math.round(img.height*s);
  const c=makeCanvas(w,h); const x=c.getContext('2d',{willReadFrequently:true});
  x.drawImage(img,0,0,w,h);
  return x.getImageData(0,0,w,h);
}

export function clone(id){ return new ImageData(new Uint8ClampedArray(id.data), id.width, id.height); }

export function luminance(id){
  const {data,width,height}=id, out=new Float32Array(width*height);
  for(let i=0,j=0;i<data.length;i+=4,j++) out[j]=0.2126*data[i]+0.7152*data[i+1]+0.0722*data[i+2];
  return out;
}

export function boxBlur(src,w,h,r){
  if(r<1) return Float32Array.from(src);
  const tmp=new Float32Array(src.length), out=new Float32Array(src.length);
  const n=2*r+1;
  for(let y=0;y<h;y++){ let acc=0;
    for(let x=-r;x<=r;x++) acc+=src[y*w+Math.min(w-1,Math.max(0,x))];
    for(let x=0;x<w;x++){ tmp[y*w+x]=acc/n;
      acc+=src[y*w+Math.min(w-1,x+r+1)]-src[y*w+Math.max(0,x-r)];
    }}
  for(let x=0;x<w;x++){ let acc=0;
    for(let y=-r;y<=r;y++) acc+=tmp[Math.min(h-1,Math.max(0,y))*w+x];
    for(let y=0;y<h;y++){ out[y*w+x]=acc/n;
      acc+=tmp[Math.min(h-1,y+r+1)*w+x]-tmp[Math.max(0,y-r)*w+x];
    }}
  return out;
}

export function sobel(lum,w,h){
  const mag=new Float32Array(w*h);
  for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
    const i=y*w+x;
    const gx=-lum[i-w-1]-2*lum[i-1]-lum[i+w-1]+lum[i-w+1]+2*lum[i+1]+lum[i+w+1];
    const gy=-lum[i-w-1]-2*lum[i-w]-lum[i-w+1]+lum[i+w-1]+2*lum[i+w]+lum[i+w+1];
    mag[i]=Math.hypot(gx,gy);
  }
  return mag;
}

// ---------- VALUE ENGINE ----------
// steps: number of value groups (2..12) or 0 = unlimited (continuous study)
export function valueStudy(id, steps, softness=0){
  const {width:w,height:h}=id;
  const lum=luminance(id);
  const out=new ImageData(w,h);
  if(steps===0){ // continuous grayscale
    for(let j=0,i=0;j<lum.length;j++,i+=4){ const v=lum[j]; out.data[i]=out.data[i+1]=out.data[i+2]=v; out.data[i+3]=255; }
    return out;
  }
  // histogram-balanced thresholds (academic grouping — equal population bias
  // blended with equal spacing so shadow families stay massed)
  const sorted=Float32Array.from(lum).sort();
  const levels=[];
  for(let k=0;k<steps;k++){
    const qi=sorted[Math.floor((k+0.5)/steps*(sorted.length-1))];
    const eq=(k+0.5)/steps*255;
    levels.push(0.5*qi+0.5*eq);
  }
  const soft=softness*(255/steps)*0.5;
  for(let j=0,i=0;j<lum.length;j++,i+=4){
    const v=lum[j];
    // nearest level, optionally blended toward neighbour for soft transitions
    let bi=0,bd=1e9;
    for(let k=0;k<steps;k++){ const d=Math.abs(v-levels[k]); if(d<bd){bd=d;bi=k;} }
    let val=levels[bi];
    if(soft>0){
      const ni=v>levels[bi]?Math.min(steps-1,bi+1):Math.max(0,bi-1);
      if(ni!==bi){ const blend=Math.max(0,1-bd/soft)*0.5; val=levels[bi]*(1-blend)+levels[ni]*blend; }
    }
    out.data[i]=out.data[i+1]=out.data[i+2]=val; out.data[i+3]=255;
  }
  return out;
}

export function notan(id, threshold=0.5){
  const {width:w,height:h}=id, lum=luminance(id);
  const sorted=Float32Array.from(lum).sort();
  const t=sorted[Math.floor(threshold*(sorted.length-1))];
  const out=new ImageData(w,h);
  for(let j=0,i=0;j<lum.length;j++,i+=4){
    const v=lum[j]>t?245:24;
    out.data[i]=out.data[i+1]=out.data[i+2]=v; out.data[i+3]=255;
  }
  return out;
}

export function histogram(id){
  const lum=luminance(id), bins=new Array(64).fill(0);
  for(const v of lum) bins[Math.min(63,v/4|0)]++;
  const m=Math.max(...bins);
  return bins.map(b=>b/m);
}

// ---------- COLOUR ENGINE ----------
// k-means in Lab with painterly controls. Returns {image, clusters}
import { rgbToLab } from './pigments.js';

export function colourStudy(id, opts){
  const { k=12, saturation=1, tempBias=0, valueSteps=0, painterliness=0.3 } = opts;
  const {width:w,height:h,data}=id;
  // sample for speed
  const step=Math.max(1, Math.floor(Math.sqrt((w*h)/24000)));
  const samples=[];
  for(let y=0;y<h;y+=step) for(let x=0;x<w;x+=step){
    const i=(y*w+x)*4; samples.push(rgbToLab([data[i],data[i+1],data[i+2]]));
  }
  // init centroids spread across L
  let cents=[];
  const byL=[...samples].sort((a,b)=>a[0]-b[0]);
  for(let i=0;i<k;i++) cents.push([...byL[Math.floor((i+0.5)/k*(byL.length-1))]]);
  for(let iter=0;iter<8;iter++){
    const sum=cents.map(()=>[0,0,0,0]);
    for(const s of samples){
      let bi=0,bd=1e9;
      for(let c=0;c<k;c++){ const d=(s[0]-cents[c][0])**2+(s[1]-cents[c][1])**2+(s[2]-cents[c][2])**2; if(d<bd){bd=d;bi=c;} }
      sum[bi][0]+=s[0]; sum[bi][1]+=s[1]; sum[bi][2]+=s[2]; sum[bi][3]++;
    }
    cents=sum.map((s,i)=> s[3]? [s[0]/s[3],s[1]/s[3],s[2]/s[3]] : cents[i]);
  }
  // apply painterly controls to centroids
  const adj=cents.map(([L,A,B])=>{
    A*=saturation; B*=saturation;
    B+= tempBias*14; A+= tempBias*6;      // warm push: +b, slight +a
    if(valueSteps>0){ L=Math.round(L/(100/valueSteps))*(100/valueSteps)+ (100/valueSteps)/2; L=Math.min(98,L); }
    return [L,A,B];
  });
  const cRgb=adj.map(labToRgb);
  const counts=new Array(k).fill(0);
  const out=new ImageData(w,h);
  const soft=painterliness*10;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    const lab=rgbToLab([data[i],data[i+1],data[i+2]]);
    let bi=0,bd=1e9,si=0,sd=1e9;
    for(let c=0;c<k;c++){
      const d=(lab[0]-cents[c][0])**2+(lab[1]-cents[c][1])**2+(lab[2]-cents[c][2])**2;
      if(d<bd){ sd=bd; si=bi; bd=d; bi=c; } else if(d<sd){ sd=d; si=c; }
    }
    counts[bi]++;
    let [r,g,b]=cRgb[bi];
    if(soft>0 && sd>0){
      const t=Math.max(0, 1-(sd-bd)/(soft*soft*40))*0.4;
      const s=cRgb[si]; r=r*(1-t)+s[0]*t; g=g*(1-t)+s[1]*t; b=b*(1-t)+s[2]*t;
    }
    out.data[i]=r; out.data[i+1]=g; out.data[i+2]=b; out.data[i+3]=255;
  }
  const total=counts.reduce((a,b)=>a+b,0);
  const clusters=cRgb.map((rgb,i)=>({ rgb, lab:adj[i], share:counts[i]/total }))
    .filter(c=>c.share>0.002).sort((a,b)=>b.share-a.share);
  return { image:out, clusters };
}

export function labToRgb([L,A,B]){
  const fy=(L+16)/116, fx=fy+A/500, fz=fy-B/200;
  const fi=t=>{ const t3=t*t*t; return t3>0.008856? t3 : (t-16/116)/7.787; };
  const X=fi(fx)*0.95047, Y=fi(fy), Z=fi(fz)*1.08883;
  let r= X*3.2406 - Y*1.5372 - Z*0.4986,
      g=-X*0.9689 + Y*1.8758 + Z*0.0415,
      b= X*0.0557 - Y*0.2040 + Z*1.0570;
  const l2s=c=>{ c=c<=0.0031308? c*12.92 : 1.055*Math.pow(Math.max(0,c),1/2.4)-0.055; return Math.max(0,Math.min(255,Math.round(c*255))); };
  return [l2s(r),l2s(g),l2s(b)];
}

// ---------- EDGE ENGINE ----------
// Classifies edges: hard (sharp gradient), soft (present after blur only),
// lost (value contrast collapses). Renders a hierarchy map.
export function edgeHierarchy(id){
  const {width:w,height:h}=id;
  const lum=luminance(id);
  const fine=sobel(lum,w,h);
  const coarse=sobel(boxBlur(lum,w,h,4),w,h);
  const out=new ImageData(w,h);
  // paper ground
  for(let i=0;i<out.data.length;i+=4){ out.data[i]=26; out.data[i+1]=22; out.data[i+2]=18; out.data[i+3]=255; }
  for(let j=0,i=0;j<fine.length;j++,i+=4){
    const f=fine[j], c=coarse[j];
    if(f>140){ out.data[i]=237;out.data[i+1]=228;out.data[i+2]=211; }          // hard — lead white
    else if(c>60 && f>40){ out.data[i]=201;out.data[i+1]=162;out.data[i+2]=39; } // soft — gold
    else if(c>34){ out.data[i]=122;out.data[i+1]=147;out.data[i+2]=168; }        // lost/atmospheric — cool
  }
  return out;
}

// ---------- MAP ENGINES ----------
export function temperatureMap(id){
  const {width:w,height:h,data}=id, out=new ImageData(w,h);
  for(let i=0;i<data.length;i+=4){
    const lab=rgbToLab([data[i],data[i+1],data[i+2]]);
    const warmth=(lab[2]*0.8+lab[1]*0.45)/60; // b* mostly
    const L=lab[0]*2.2+20;
    if(warmth>0.06){ out.data[i]=Math.min(255,L+70); out.data[i+1]=L*0.62; out.data[i+2]=L*0.3; }
    else if(warmth<-0.06){ out.data[i]=L*0.3; out.data[i+1]=L*0.6; out.data[i+2]=Math.min(255,L+70); }
    else { out.data[i]=out.data[i+1]=out.data[i+2]=L*0.75; }
    out.data[i+3]=255;
  }
  return out;
}

export function saturationMap(id){
  const {width:w,height:h,data}=id, out=new ImageData(w,h);
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2];
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
    const s=mx? (mx-mn)/mx : 0;
    const v=s*255;
    out.data[i]=v; out.data[i+1]=Math.min(255,v*0.82); out.data[i+2]=v*0.15; out.data[i+3]=255;
  }
  return out;
}

export function lightMap(id){
  // Light family vs shadow family vs halftone — the atelier "big three".
  const {width:w,height:h}=id, lum=luminance(id);
  const sm=boxBlur(lum,w,h,3);
  const sorted=Float32Array.from(sm).sort();
  const tShadow=sorted[Math.floor(sorted.length*0.42)];
  const tLight=sorted[Math.floor(sorted.length*0.72)];
  const out=new ImageData(w,h);
  for(let j=0,i=0;j<sm.length;j++,i+=4){
    const v=sm[j];
    if(v>=tLight){ out.data[i]=240;out.data[i+1]=224;out.data[i+2]=188; }       // light family
    else if(v<=tShadow){ out.data[i]=44;out.data[i+1]=36;out.data[i+2]=52; }    // shadow family
    else { out.data[i]=150;out.data[i+1]=124;out.data[i+2]=104; }               // halftone
    out.data[i+3]=255;
  }
  return out;
}

// ---------- DRAWING ENGINE ----------
export function drawingGuide(id, mode='construction'){
  const {width:w,height:h}=id, lum=luminance(id);
  const g1=boxBlur(lum,w,h,1), g2=boxBlur(lum,w,h, mode==='gesture'?7:3);
  const out=new ImageData(w,h);
  for(let i=0;i<out.data.length;i+=4){ out.data[i]=243; out.data[i+1]=238; out.data[i+2]=226; out.data[i+3]=255; }
  const th= mode==='contour'? 6 : mode==='gesture'? 10 : 8;
  for(let j=0,i=0;j<g1.length;j++,i+=4){
    const d=g1[j]-g2[j];
    if(d < -th/2){ // dark-of-gaussian line
      const ink=Math.max(60, 200+d*6);
      out.data[i]=ink*0.42+30; out.data[i+1]=ink*0.36+22; out.data[i+2]=ink*0.3+16;
    }
  }
  if(mode==='shadowshapes'){
    const sm=boxBlur(lum,w,h,4);
    const sorted=Float32Array.from(sm).sort();
    const t=sorted[Math.floor(sorted.length*0.4)];
    for(let j=0,i=0;j<sm.length;j++,i+=4){
      if(sm[j]<=t){ out.data[i]=out.data[i]*0.55; out.data[i+1]=out.data[i+1]*0.52; out.data[i+2]=out.data[i+2]*0.5; }
    }
  }
  return out;
}

// composition overlays are drawn as vectors on top (see app.js)

// ---------- BRUSH ENGINE ----------
// Flow field from blurred gradients → stroke direction hints.
export function brushDirection(id, density=18){
  const {width:w,height:h}=id, lum=boxBlur(luminance(id),w,h,5);
  const strokes=[];
  const cell=Math.max(10, Math.floor(Math.min(w,h)/density));
  for(let y=cell;y<h-cell;y+=cell) for(let x=cell;x<w-cell;x+=cell){
    const i=y*w+x;
    const gx=lum[i+1]-lum[i-1], gy=lum[i+w]-lum[i-w];
    const mag=Math.hypot(gx,gy);
    // stroke follows the form: perpendicular to gradient
    const a=Math.atan2(gy,gx)+Math.PI/2;
    const len=cell*(0.5+Math.min(1, mag/24)*0.7);
    strokes.push({x,y,a,len,mag, v:lum[i]});
  }
  return strokes;
}

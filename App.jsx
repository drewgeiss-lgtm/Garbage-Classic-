import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const TEAMS = {
G: { name: "Team Geissy", short: "G" },
T: { name: "Team Titti", short: "T" },
};

const PLAYERS = {
Drew:{team:"G"},Danny:{team:"G"},Chuck:{team:"G"},Nik:{team:"G"},
Jay:{team:"G"},Adam:{team:"G"},Matt:{team:"G"},Tal:{team:"G"},
Taylor:{team:"T"},Jason:{team:"T"},Peters:{team:"T"},Tyler:{team:"T"},
Aurit:{team:"T"},Eric:{team:"T"},Shane:{team:"T"},Trevor:{team:"T"},
};

// Round 1: 4 groups, each has a G pair and T pair
const R1_GROUPS = [
{id:1,tee:"8:00 AM",G:["Drew","Danny"], T:["Taylor","Jason"]},
{id:2,tee:"8:10 AM",G:["Chuck","Nik"], T:["Peters","Tyler"]},
{id:3,tee:"8:20 AM",G:["Jay","Adam"], T:["Aurit","Eric"]},
{id:4,tee:"8:30 AM",G:["Matt","Tal"], T:["Shane","Trevor"]},
];

// Holes 1-6: Best Ball, 7-12: Shamble, 13-18: Alt Shot
const R1_FORMAT = (h) => h<=6?"BB":h<=12?"SH":"AS";
const FORMAT_LABELS = {BB:"Best Ball",SH:"Shamble",AS:"Alt Shot"};

const R2_GROUPS = [
{id:1,tee:"1:30 PM",G:["Chuck","Adam"], T:["Jason","Trevor"]},
{id:2,tee:"1:40 PM",G:["Drew","Matt"], T:["Peters","Eric"]},
{id:3,tee:"1:50 PM",G:["Nik","Tal"], T:["Taylor","Tyler"]},
{id:4,tee:"2:00 PM",G:["Jay","Danny"], T:["Shane","Aurit"]},
];

const R3_MATCHES = [
{id:1,G:"Drew", T:"Taylor"},{id:2,G:"Danny",T:"Jason"},
{id:3,G:"Chuck", T:"Peters"},{id:4,G:"Nik", T:"Tyler"},
{id:5,G:"Jay", T:"Aurit"}, {id:6,G:"Adam", T:"Eric"},
{id:7,G:"Matt", T:"Shane"}, {id:8,G:"Tal", T:"Trevor"},
];

const HOLES = Array.from({length:18},(_,i)=>i+1);

// ─── SCORING LOGIC ────────────────────────────────────────────────────────────

// R1: for each group, compute who won each format segment (BB/SH/AS)
// scores shape: { [groupId]: { G: [18 scores], T: [18 scores] } }
function calcR1(r1={}) {
let G=0, T=0;
const groupResults = {};
R1_GROUPS.forEach(grp=>{
const d = r1[grp.id]||{G:Array(18).fill(""),T:Array(18).fill("")};
const seg = {BB:{G:0,T:0,holes:0}, SH:{G:0,T:0,holes:0}, AS:{G:0,T:0,holes:0}};
HOLES.forEach((h,i)=>{
const fmt = R1_FORMAT(h);
const gs = parseInt(d.G?.[i]);
const ts = parseInt(d.T?.[i]);
if(!isNaN(gs)&&!isNaN(ts)) {
seg[fmt].holes++;
seg[fmt].G += gs;
seg[fmt].T += ts;
}
});
const res = {};
["BB","SH","AS"].forEach(fmt=>{
const s = seg[fmt];
if(s.holes===0) res[fmt]=null;
else if(s.G<s.T) { res[fmt]="G"; G+=1; }
else if(s.T<s.G) { res[fmt]="T"; T+=1; }
else { res[fmt]="tie"; G+=0.5; T+=0.5; }
});
groupResults[grp.id] = res;
});
return {G,T,groupResults};
}

// R2: scores shape: { [groupId]: { G: [18], T: [18] } }, bestBallWinner manual
function calcR2(r2={}) {
let G=0, T=0;
if(r2.bb==="G") G+=4;
else if(r2.bb==="T") T+=4;
else if(r2.bb==="tie"){G+=2;T+=2;}

const matchResults = {};
R2_GROUPS.forEach((grp,i)=>{
const d = r2.groups?.[grp.id]||{G:Array(18).fill(""),T:Array(18).fill("")};
let gs=0,ts=0,holes=0;
HOLES.forEach((_,idx)=>{
const g=parseInt(d.G?.[idx]), t=parseInt(d.T?.[idx]);
if(!isNaN(g)&&!isNaN(t)){gs+=g;ts+=t;holes++;}
});
if(holes===0) matchResults[grp.id]=null;
else if(gs<ts){matchResults[grp.id]="G";G+=2;}
else if(ts<gs){matchResults[grp.id]="T";T+=2;}
else{matchResults[grp.id]="tie";G+=1;T+=1;}
});
return {G,T,matchResults};
}

// R3: match play status per match
// scores shape: { [matchId]: { status: string, holesPlayed: number, winner: null|'G'|'T'|'tie' } }
function calcR3(r3={}) {
let G=0, T=0;
R3_MATCHES.forEach(m=>{
const d = r3[m.id]||{};
if(d.winner==="G") G+=3;
else if(d.winner==="T") T+=3;
else if(d.winner==="tie"){G+=1.5;T+=1.5;}
});
return {G,T};
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const gc="#1d6b35", gold="#c9a84c", dark="#0f1f0f", cream="#f8f6f1";

const S = {
app:{fontFamily:"'Georgia',serif",background:cream,minHeight:"100vh",color:"#1a1a1a"},
hdr:{background:dark,textAlign:"center",padding:"20px 16px 14px",borderBottom:`3px solid ${gold}`},
logoWrap:{height:90,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4},
logoSvg:{fill:"none"},
venue:{fontSize:"10px",letterSpacing:"0.2em",color:gold,opacity:0.8,textTransform:"uppercase"},
sub:{fontSize:"10px",letterSpacing:"0.15em",color:gold,opacity:0.65,textTransform:"uppercase",marginTop:2},
nav:{display:"flex",justifyContent:"center",flexWrap:"wrap",background:"#0a150a",borderBottom:"1px solid #1e3a1e"},
nb:(a)=>({padding:"10px 13px",fontSize:"11px",letterSpacing:"0.08em",textTransform:"uppercase",
fontFamily:"inherit",border:"none",cursor:"pointer",fontWeight:a?"bold":"normal",
background:a?gold:"transparent",color:a?dark:"#777",transition:"all 0.12s"}),
main:{maxWidth:820,margin:"0 auto",padding:"18px 12px"},
card:{background:"#fff",border:"1px solid #ddd",borderRadius:3,marginBottom:14,overflow:"hidden"},
ch:()=>({background:dark,color:"#fff",padding:"10px 14px",fontSize:"11px",letterSpacing:"0.1em",
textTransform:"uppercase",fontWeight:"bold",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}),
tbl:{width:"100%",borderCollapse:"collapse",fontSize:"12px"},
th:(c)=>({background:"#f0ede6",padding:"6px 8px",textAlign:"center",borderBottom:"1px solid #ddd",
fontSize:"10px",letterSpacing:"0.06em",textTransform:"uppercase",color:c||"#666"}),
td:{padding:"7px 8px",textAlign:"center",borderBottom:"1px solid #f5f2ec"},
board:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14},
team:(t)=>({background:t==="G"?"#152815":"#151528",color:"#fff",borderRadius:3,padding:"16px 10px",textAlign:"center"}),
big:{fontSize:"clamp(42px,9vw,58px)",fontWeight:"bold",lineHeight:1,color:gold},
tn:{fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",marginTop:4,opacity:0.8},
wb:(a,t)=>({padding:"5px 10px",fontSize:"11px",fontWeight:"bold",
border:`2px solid ${a?(t==="G"?gc:t==="T"?"#2a2a6a":"#555"):"#ddd"}`,
background:a?(t==="G"?gc:t==="T"?"#2a2a6a":"#555"):"#fff",
color:a?"#fff":"#bbb",borderRadius:3,cursor:"pointer",marginRight:3,
fontFamily:"inherit",transition:"all 0.1s"}),
note:{fontSize:"12px",color:"#555",lineHeight:1.6,marginBottom:12,background:"#f5f2ec",
padding:"10px 14px",borderRadius:3,border:"1px solid #e8e4dc"},
lbl:{fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",color:"#999",
margin:"14px 0 5px",borderBottom:"1px solid #e8e4dc",paddingBottom:4},
inp:{width:36,padding:"3px 2px",textAlign:"center",border:"1px solid #ccc",borderRadius:3,
fontSize:13,fontFamily:"inherit",background:"#fff"},
fmtBadge:(f)=>({display:"inline-block",padding:"1px 5px",borderRadius:2,fontSize:"9px",fontWeight:"bold",
background:f==="BB"?"#e4ede4":f==="SH"?"#e4e4ed":"#ede8e0",
color:f==="BB"?"#1a4a1a":f==="SH"?"#1a1a4a":"#4a2a0a",marginLeft:4}),
resultBadge:(r)=>({display:"inline-block",padding:"2px 7px",borderRadius:2,fontSize:"10px",fontWeight:"bold",
background:r==="G"?"#1a4a1a":r==="T"?"#1a1a4a":r==="tie"?"#555":"#eee",
color:r?"#fff":"#aaa"}),
saving:{position:"fixed",bottom:16,right:16,background:gc,color:"#fff",padding:"6px 14px",
borderRadius:20,fontSize:"11px",letterSpacing:"0.08em",zIndex:999,boxShadow:"0 2px 8px rgba(0,0,0,0.3)"},
miniScore:{display:"flex",gap:10,marginBottom:12},
miniTeam:(t)=>({background:t==="G"?"#e4ede4":"#e4e4ed",padding:"7px 14px",borderRadius:3,
textAlign:"center",minWidth:80}),
miniNum:(t)=>({fontSize:20,fontWeight:"bold",color:t==="G"?"#1a4a1a":"#1a1a4a"}),
miniLbl:{fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",color:"#777"},
};

// ─── LOGO SVG (inline, no external file needed) ───────────────────────────────

function Logo() {
return (
<svg width="200" height="80" viewBox="0 0 200 80" style={{overflow:"visible"}}>
{/* Trash can body */}
<rect x="82" y="38" width="36" height="28" rx="3" fill="#1d6b35"/>
<rect x="79" y="34" width="42" height="6" rx="2" fill="#1d6b35"/>
{/* Lid */}
<rect x="83" y="30" width="34" height="5" rx="2" fill="#155228"/>
{/* Vertical lines on can */}
{[90,97,104,111].map(x=>(
<rect key={x} x={x} y="40" width="2" height="22" rx="1" fill="#155228" opacity="0.6"/>
))}
{/* Flag pole */}
<rect x="99" y="8" width="2" height="22" fill="#1d6b35"/>
{/* Flag */}
<polygon points="101,8 118,13 101,18" fill="#1d6b35"/>
{/* Arched text top */}
<path id="arc" d="M 55,58 A 50,50 0 0,1 145,58" fill="none"/>
<text fontSize="9.5" fill="#1d6b35" fontFamily="Georgia,serif" fontStyle="italic" letterSpacing="0.5">
<textPath href="#arc" startOffset="8%">Garbage Golf. Great Friends.</textPath>
</text>
{/* Bottom text */}
<text x="100" y="74" textAnchor="middle" fontSize="13" fontWeight="bold"
fill="#1d6b35" fontFamily="Georgia,serif" letterSpacing="2">GARBAGE CLASSIC</text>
<text x="100" y="82" textAnchor="middle" fontSize="7" fill="#1d6b35"
fontFamily="Georgia,serif" letterSpacing="3">ESTABLISHED 2022</text>
</svg>
);
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function WS({value,onChange}) {
return (
<div style={{display:"flex",flexWrap:"wrap",gap:3}}>
{[["G","Team G"],["T","Team T"],["tie","Tie"]].map(([v,lbl])=>(
<button key={v} style={S.wb(value===v,v)} onClick={()=>onChange(value===v?null:v)}>{lbl}</button>
))}
</div>
);
}

function MiniScore({pts}) {
return (
<div style={S.miniScore}>
{["G","T"].map(t=>(
<div key={t} style={S.miniTeam(t)}>
<div style={S.miniNum(t)}>{pts[t]||0}</div>
<div style={S.miniLbl}>{TEAMS[t].name}</div>
</div>
))}
</div>
);
}

// Hole-by-hole score entry grid for a single group (G pair vs T pair)
function HoleGrid({gLabel, tLabel, scores, onChange, highlightFn}) {
// scores: { G: [18], T: [18] }
const g = scores?.G || Array(18).fill("");
const t = scores?.T || Array(18).fill("");

const setG = (i,v) => { const a=[...g]; a[i]=v; onChange({G:a,T:t}); };
const setT = (i,v) => { const a=[...t]; a[i]=v; onChange({G:g,T:a}); };

// group holes by format for R1
const fmtGroups = highlightFn ? [
{fmt:"BB",label:"Best Ball",holes:[0,1,2,3,4,5]},
{fmt:"SH",label:"Shamble",holes:[6,7,8,9,10,11]},
{fmt:"AS",label:"Alt Shot",holes:[12,13,14,15,16,17]},
] : null;

return (
<div style={{overflowX:"auto"}}>
{fmtGroups ? fmtGroups.map(({fmt,label,holes})=>(
<div key={fmt} style={{marginBottom:10}}>
<div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",
color:"#888",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
H.{holes[0]+1}–{holes[holes.length-1]+1}
<span style={S.fmtBadge(fmt)}>{label}</span>
</div>
<table style={S.tbl}>
<thead>
<tr>
<th style={{...S.th(),textAlign:"left",paddingLeft:8,width:90}}>Pair</th>
{holes.map(i=>(
<th key={i} style={S.th()}>{i+1}</th>
))}
<th style={S.th()}>Tot</th>
</tr>
</thead>
<tbody>
{[[gLabel,"G",g,setG],[tLabel,"T",t,setT]].map(([lbl,team,arr,setter])=>(
<tr key={team}>
<td style={{...S.td,textAlign:"left",paddingLeft:8,fontSize:11,
fontWeight:"bold",color:team==="G"?"#1a4a1a":"#1a1a4a"}}>{lbl}</td>
{holes.map(i=>(
<td key={i} style={S.td}>
<input type="number" min="1" max="15" style={S.inp}
value={arr[i]||""} onChange={e=>setter(i,e.target.value)}/>
</td>
))}
<td style={{...S.td,fontWeight:"bold"}}>
{holes.reduce((s,i)=>{const v=parseInt(arr[i]);return s+(isNaN(v)?0:v)},0)||""}
</td>
</tr>
))}
</tbody>
</table>
</div>
)) : (
<table style={S.tbl}>
<thead>
<tr>
<th style={{...S.th(),textAlign:"left",paddingLeft:8,width:90}}>Pair</th>
{HOLES.map(h=><th key={h} style={S.th()}>{h}</th>)}
<th style={S.th()}>Tot</th>
</tr>
</thead>
<tbody>
{[[gLabel,"G",g,setG],[tLabel,"T",t,setT]].map(([lbl,team,arr,setter])=>(
<tr key={team}>
<td style={{...S.td,textAlign:"left",paddingLeft:8,fontSize:11,
fontWeight:"bold",color:team==="G"?"#1a4a1a":"#1a1a4a"}}>{lbl}</td>
{HOLES.map((_,i)=>(
<td key={i} style={S.td}>
<input type="number" min="1" max="15" style={S.inp}
value={arr[i]||""} onChange={e=>setter(i,e.target.value)}/>
</td>
))}
<td style={{...S.td,fontWeight:"bold"}}>
{arr.reduce((s,v)=>{const n=parseInt(v);return s+(isNaN(n)?0:n)},0)||""}
</td>
</tr>
))}
</tbody>
</table>
)}
</div>
);
}

// ─── SCOREBOARD ───────────────────────────────────────────────────────────────

function Scoreboard({scores}) {
const {r1={},r2={},r3={},euchre=null} = scores;
const p1=calcR1(r1), p2=calcR2(r2), p3=calcR3(r3);
const eg={G:euchre==="G"?0.5:euchre==="tie"?0.25:0,
T:euchre==="T"?0.5:euchre==="tie"?0.25:0};
const tot={G:p1.G+p2.G+p3.G+eg.G, T:p1.T+p2.T+p3.T+eg.T};
const leading=tot.G>tot.T?"G":tot.T>tot.G?"T":null;

return (
<div>
<div style={S.board}>
{["G","T"].map(t=>(
<div key={t} style={S.team(t)}>
<div style={S.big}>{tot[t]}</div>
<div style={S.tn}>{TEAMS[t].name}</div>
</div>
))}
</div>
{leading&&(tot.G>0||tot.T>0)&&(
<div style={{textAlign:"center",marginBottom:12,padding:"8px 12px",background:gold,
borderRadius:3,fontSize:"12px",fontWeight:"bold",letterSpacing:"0.1em",textTransform:"uppercase"}}>
{TEAMS[leading].name} leads by {Math.abs(tot.G-tot.T)} {Math.abs(tot.G-tot.T)===1?"pt":"pts"}
</div>
)}
<div style={S.card}>
<table style={S.tbl}>
<thead><tr>
<th style={{...S.th(),textAlign:"left",paddingLeft:12}}>Round</th>
<th style={S.th()}>Pts Avail</th>
<th style={S.th("#1a4a1a")}>Geissy</th>
<th style={S.th("#1a1a4a")}>Titti</th>
</tr></thead>
<tbody>
{[
["R1 – Woodlands (BB/Shamble/Alt Shot)",12,p1.G,p1.T],
["R2 – Links (Scramble + Stroke)",12,p2.G,p2.T],
["R3 – Links (Match Play)",24,p3.G,p3.T],
["Euchre",0.5,eg.G,eg.T],
].map(([lbl,av,g,t])=>(
<tr key={lbl}>
<td style={{...S.td,textAlign:"left",paddingLeft:12,fontSize:12}}>{lbl}</td>
<td style={S.td}>{av}</td>
<td style={{...S.td,fontWeight:"bold",color:"#1a4a1a"}}>{g||0}</td>
<td style={{...S.td,fontWeight:"bold",color:"#1a1a4a"}}>{t||0}</td>
</tr>
))}
<tr style={{background:"#f5f2ec"}}>
<td style={{...S.td,textAlign:"left",paddingLeft:12,fontWeight:"bold"}}>TOTAL</td>
<td style={{...S.td,fontWeight:"bold"}}>48.5</td>
<td style={{...S.td,fontWeight:"bold",color:"#1a4a1a",fontSize:16}}>{tot.G}</td>
<td style={{...S.td,fontWeight:"bold",color:"#1a1a4a",fontSize:16}}>{tot.T}</td>
</tr>
</tbody>
</table>
</div>

{/* R1 Group Results */}
<div style={S.lbl}>Round 1 — Format Results by Group</div>
<div style={S.card}>
<table style={S.tbl}>
<thead><tr>
<th style={{...S.th(),textAlign:"left",paddingLeft:12}}>Group</th>
<th style={S.th()}>Best Ball</th>
<th style={S.th()}>Shamble</th>
<th style={S.th()}>Alt Shot</th>
</tr></thead>
<tbody>
{R1_GROUPS.map(grp=>{
const res=p1.groupResults?.[grp.id]||{};
return (
<tr key={grp.id}>
<td style={{...S.td,textAlign:"left",paddingLeft:12,fontSize:11}}>
<span style={{color:"#1a4a1a",fontWeight:"bold"}}>{grp.G.join("/")}</span>
<span style={{margin:"0 4px",color:"#aaa"}}>vs</span>
<span style={{color:"#1a1a4a",fontWeight:"bold"}}>{grp.T.join("/")}</span>
</td>
{["BB","SH","AS"].map(f=>(
<td key={f} style={S.td}>
<span style={S.resultBadge(res[f])}>
{res[f]?res[f]==="tie"?"TIE":TEAMS[res[f]].name:"–"}
</span>
</td>
))}
</tr>
);
})}
</tbody>
</table>
</div>
</div>
);
}

// ─── ROUND 1 ─────────────────────────────────────────────────────────────────

function R1Tab({scores,update}) {
const r1 = scores.r1||{};
const pts = calcR1(r1);
const setGroup=(id,val)=>update({...scores,r1:{...r1,[id]:val}});
return (
<div>
<div style={S.note}>
<strong>Lawsonia Woodlands · Sunday Morning</strong><br/>
Enter one score per cart pair per hole. App auto-calculates format winners.<br/>
H.1–6 Best Ball · H.7–12 Shamble · H.13–18 Alt Shot · <strong>12 pts available</strong>
</div>
<MiniScore pts={pts}/>
{R1_GROUPS.map(grp=>{
const d=r1[grp.id]||{G:Array(18).fill(""),T:Array(18).fill("")};
const res=pts.groupResults?.[grp.id]||{};
return (
<div key={grp.id} style={S.card}>
<div style={S.ch()}>
<span>Group {grp.id} · {grp.tee}</span>
<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
{["BB","SH","AS"].map(f=>(
<span key={f} style={{fontSize:10}}>
<span style={S.fmtBadge(f)}>{FORMAT_LABELS[f]}</span>
{" "}
<span style={S.resultBadge(res[f])}>
{res[f]?res[f]==="tie"?"TIE":TEAMS[res[f]].name:"–"}
</span>
</span>
))}
</div>
</div>
<div style={{padding:"12px 10px"}}>
<HoleGrid
gLabel={grp.G.join(" & ")}
tLabel={grp.T.join(" & ")}
scores={d}
onChange={val=>setGroup(grp.id,val)}
highlightFn={true}
/>
</div>
</div>
);
})}
</div>
);
}

// ─── ROUND 2 ─────────────────────────────────────────────────────────────────

function R2Tab({scores,update}) {
const r2 = scores.r2||{bb:null,groups:{}};
const pts = calcR2(r2);
const setGroup=(id,val)=>update({...scores,r2:{...r2,groups:{...(r2.groups||{}),[id]:val}}});
return (
<div>
<div style={S.note}>
<strong>Lawsonia Links · Sunday Afternoon</strong><br/>
Enter scramble scores per hole. App calculates 2v2 stroke match winners automatically.<br/>
Best Ball Scorecard winner is selected manually (4 pts) · <strong>12 pts available</strong>
</div>
<MiniScore pts={pts}/>
<div style={S.card}>
<div style={S.ch()}>Best Ball Scorecard Winner <span style={{fontSize:11,opacity:0.6,marginLeft:4}}>— 4 pts</span></div>
<div style={{padding:"12px 14px"}}>
<WS value={r2.bb||null} onChange={v=>update({...scores,r2:{...r2,bb:v}})}/>
</div>
</div>
<div style={S.lbl}>2v2 Stroke Matches — 2 pts each (auto-calculated from scores)</div>
{R2_GROUPS.map((grp,i)=>{
const d=(r2.groups||{})[grp.id]||{G:Array(18).fill(""),T:Array(18).fill("")};
const winner=pts.matchResults?.[grp.id];
return (
<div key={grp.id} style={S.card}>
<div style={S.ch()}>
<span>Group {grp.id} · {grp.tee}</span>
<span style={{display:"flex",alignItems:"center",gap:6}}>
<span style={{fontSize:11,opacity:0.8}}>
<span style={{color:"#7fc97f"}}>{grp.G.join(" & ")}</span>
<span style={{margin:"0 4px",opacity:0.4}}>vs</span>
<span style={{color:"#7f7fc9"}}>{grp.T.join(" & ")}</span>
</span>
<span style={S.resultBadge(winner)}>
{winner?winner==="tie"?"TIE":TEAMS[winner].name:"–"}
</span>
</span>
</div>
<div style={{padding:"12px 10px"}}>
<HoleGrid
gLabel={grp.G.join(" & ")}
tLabel={grp.T.join(" & ")}
scores={d}
onChange={val=>setGroup(grp.id,val)}
highlightFn={false}
/>
</div>
</div>
);
})}
</div>
);
}

// ─── ROUND 3 ─────────────────────────────────────────────────────────────────

const MP_STATUS = [
"AS","1UP","2UP","3UP","4UP","5UP","6UP","7UP","8UP",
"9UP","10UP","11UP","12UP","13UP","14UP","15UP","16UP","17UP","AS (done)"
];

function R3Tab({scores,update}) {
const r3 = scores.r3||{};
const pts = calcR3(r3);

const setMatch=(id,field,val)=>{
update({...scores,r3:{...r3,[id]:{...(r3[id]||{}),[field]:val}}});
};

return (
<div>
<div style={S.note}>
<strong>Lawsonia Links · Monday Morning</strong><br/>
Enter match play status after each hole + mark winner when complete. 3 pts per match.<br/>
<strong>24 pts available</strong>
</div>
<MiniScore pts={pts}/>
{R3_MATCHES.map(m=>{
const d=r3[m.id]||{status:"",holesPlayed:"",winner:null};
return (
<div key={m.id} style={S.card}>
<div style={S.ch()}>
<span>Match {m.id}</span>
<span>
<span style={{color:"#7fc97f",fontSize:12}}>{m.G}</span>
<span style={{margin:"0 6px",opacity:0.4}}>vs</span>
<span style={{color:"#7f7fc9",fontSize:12}}>{m.T}</span>
</span>
</div>
<div style={{padding:"12px 14px"}}>
<div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
<div>
<div style={{fontSize:10,color:"#888",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>Status</div>
<select value={d.status||""} onChange={e=>setMatch(m.id,"status",e.target.value)}
style={{padding:"5px 8px",border:"1px solid #ccc",borderRadius:3,fontSize:12,fontFamily:"inherit",background:"#fff"}}>
<option value="">— select —</option>
{["AS","1UP G","2UP G","3UP G","4UP G","5UP G","6UP G","7UP G","8UP G",
"1UP T","2UP T","3UP T","4UP T","5UP T","6UP T","7UP T","8UP T"].map(s=>(
<option key={s} value={s}>{s}</option>
))}
</select>
</div>
<div>
<div style={{fontSize:10,color:"#888",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>Holes Played</div>
<input type="number" min="0" max="18" style={{...S.inp,width:48}}
value={d.holesPlayed||""} onChange={e=>setMatch(m.id,"holesPlayed",e.target.value)}
placeholder="0"/>
</div>
</div>
<div>
<div style={{fontSize:10,color:"#888",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Match Result</div>
<WS value={d.winner||null} onChange={v=>setMatch(m.id,"winner",v)}/>
</div>
{d.winner&&(
<div style={{marginTop:8,fontSize:11,color:d.winner==="G"?"#1a4a1a":d.winner==="T"?"#1a1a4a":"#555",fontWeight:"bold"}}>
✓ {d.winner==="tie"?"Halved (tie)":TEAMS[d.winner].name+" wins"} — 3 pts
</div>
)}
</div>
</div>
);
})}
</div>
);
}

// ─── EUCHRE ──────────────────────────────────────────────────────────────────

function EuchreTab({scores,update}) {
return (
<div>
<div style={S.note}><strong>Sunday Evening — Tiebreaker</strong><br/>One game of Euchre · 0.5 pts to winner</div>
<div style={S.card}>
<div style={S.ch()}>Euchre Winner</div>
<div style={{padding:"14px 16px"}}>
<WS value={scores.euchre||null} onChange={v=>update({...scores,euchre:v})}/>
</div>
</div>
</div>
);
}

// ─── INFO ─────────────────────────────────────────────────────────────────────

function InfoTab() {
return (
<div>
<div style={S.lbl}>Cost Breakdown</div>
<div style={S.card}>
<table style={S.tbl}><tbody>
{[
["Lodging — Venmo Drew","$65.63/person"],
["Golf Sunday (Replay Rate) — Pay at Course","$185/person"],
["Golf Monday — Pay at Course","$120/person"],
["Food & Catering — Venmo Drew","$40/person"],
["Prize Pool — Venmo Drew","$125/person"],
["All-In Total","$535.63/person"],
].map(([k,v])=>(
<tr key={k}>
<td style={{...S.td,textAlign:"left",paddingLeft:12,fontSize:12}}>{k}</td>
<td style={{...S.td,fontWeight:"bold"}}>{v}</td>
</tr>
))}
</tbody></table>
</div>
<div style={S.lbl}>Prize Payouts — $2,000 Pool</div>
<div style={S.card}>
<table style={S.tbl}><tbody>
{[
["🏆 Team Win","$1,600","$200 × 8 players"],
["🎯 Net Low Score Monday","$100","Score less agreed handicap"],
["🌀 Low 2-Man Scramble","$150","$75 per player"],
["📏 Largest Sun AM Win Margin","$150","$75 per player"],
].map(([k,v,n])=>(
<tr key={k}>
<td style={{...S.td,textAlign:"left",paddingLeft:12,fontSize:12}}>{k}</td>
<td style={{...S.td,fontWeight:"bold"}}>{v}</td>
<td style={{...S.td,color:"#999",fontSize:11}}>{n}</td>
</tr>
))}
</tbody></table>
</div>
<div style={S.lbl}>Side Games</div>
<div style={S.card}>
<table style={S.tbl}>
<thead><tr>
<th style={{...S.th(),textAlign:"left",paddingLeft:12}}>Game</th>
<th style={S.th()}>Stakes</th>
<th style={{...S.th(),textAlign:"left"}}>Rules</th>
</tr></thead>
<tbody>
{[
["Skins","$1–5/skin","Lowest score per hole wins. Ties carry."],
["Snake","$5–20 total","3-putt gets the snake. Last holder pays."],
["Rabbit","$5–10","Win a hole outright to catch it. Hold at turn/end to win."],
].map(([g,s,d])=>(
<tr key={g}>
<td style={{...S.td,textAlign:"left",paddingLeft:12,fontWeight:"bold"}}>{g}</td>
<td style={S.td}>{s}</td>
<td style={{...S.td,textAlign:"left",color:"#666",fontSize:12}}>{d}</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const DEFAULT = {r1:{},r2:{bb:null,groups:{}},r3:{},euchre:null};

export default function App() {
const [tab,setTab] = useState("board");
const [scores,setScores] = useState(DEFAULT);
const [saving,setSaving] = useState(false);
const [loaded,setLoaded] = useState(false);

useEffect(()=>{
async function load(){
const {data}=await supabase.from("scores").select("*").eq("id",1).single();
if(data?.payload&&Object.keys(data.payload).length) setScores(data.payload);
setLoaded(true);
}
load();
},[]);

useEffect(()=>{
const ch=supabase.channel("scores-live")
.on("postgres_changes",{event:"UPDATE",schema:"public",table:"scores"},
p=>{ if(p.new?.payload) setScores(p.new.payload); })
.subscribe();
return ()=>supabase.removeChannel(ch);
},[]);

const save=useCallback(async(next)=>{
setScores(next);
setSaving(true);
await supabase.from("scores").upsert({id:1,payload:next});
setTimeout(()=>setSaving(false),800);
},[]);

const tabs=[
{id:"board",label:"Leaderboard"},
{id:"r1", label:"Round 1"},
{id:"r2", label:"Round 2"},
{id:"r3", label:"Round 3"},
{id:"euchre",label:"Euchre"},
{id:"info", label:"Info"},
];

if(!loaded) return (
<div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
<div style={{color:"#666",fontSize:13,letterSpacing:"0.1em"}}>Loading...</div>
</div>
);

return (
<div style={S.app}>
<header style={S.hdr}>
<div style={S.logoWrap}><Logo/></div>
<div style={S.venue}>Lawsonia Golf Resort · Green Lake, WI</div>
<div style={S.sub}>June 28–29, 2026</div>
</header>
<nav style={S.nav}>
{tabs.map(t=>(
<button key={t.id} style={S.nb(tab===t.id)} onClick={()=>setTab(t.id)}>{t.label}</button>
))}
</nav>
<main style={S.main}>
{tab==="board" && <Scoreboard scores={scores}/>}
{tab==="r1" && <R1Tab scores={scores} update={save}/>}
{tab==="r2" && <R2Tab scores={scores} update={save}/>}
{tab==="r3" && <R3Tab scores={scores} update={save}/>}
{tab==="euchre" && <EuchreTab scores={scores} update={save}/>}
{tab==="info" && <InfoTab/>}
</main>
<footer style={{textAlign:"center",padding:14,fontSize:9,color:"#aaa",
letterSpacing:"0.14em",borderTop:"1px solid #e0dcd4",textTransform:"uppercase"}}>
Garbage Golf. Great Friends. · Est. 2022
</footer>
{saving&&<div style={S.saving}>✓ Saved</div>}
</div>
);
}

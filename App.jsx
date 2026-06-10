import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const TEAMS = {
  G: { name: "Team Geissy", short: "G", color: "#1a3a1a" },
  T: { name: "Team Titti",  short: "T", color: "#1a1a3a" },
};

const PLAYERS = {
  Drew:{team:"G"},Danny:{team:"G"},Chuck:{team:"G"},Nik:{team:"G"},
  Jay:{team:"G"},Adam:{team:"G"},Matt:{team:"G"},Tal:{team:"G"},
  Taylor:{team:"T"},Jason:{team:"T"},Peters:{team:"T"},Tyler:{team:"T"},
  Aurit:{team:"T"},Eric:{team:"T"},Shane:{team:"T"},Trevor:{team:"T"},
};

const R1_GROUPS = [
  {id:1,tee:"8:00 AM",players:["Taylor","Jason","Drew","Danny"]},
  {id:2,tee:"8:10 AM",players:["Peters","Tyler","Chuck","Nik"]},
  {id:3,tee:"8:20 AM",players:["Aurit","Eric","Jay","Adam"]},
  {id:4,tee:"8:30 AM",players:["Shane","Trevor","Matt","Tal"]},
];

const R2_GROUPS = [
  {id:1,tee:"1:30 PM",G:["Chuck","Adam"], T:["Jason","Trevor"]},
  {id:2,tee:"1:40 PM",G:["Drew","Matt"],  T:["Peters","Eric"]},
  {id:3,tee:"1:50 PM",G:["Nik","Tal"],    T:["Taylor","Tyler"]},
  {id:4,tee:"2:00 PM",G:["Jay","Danny"],  T:["Shane","Aurit"]},
];

const R3_MATCHES = [
  {id:1,G:"Drew",  T:"Taylor"},{id:2,G:"Danny",T:"Jason"},
  {id:3,G:"Chuck", T:"Peters"},{id:4,G:"Nik",  T:"Tyler"},
  {id:5,G:"Jay",   T:"Aurit"}, {id:6,G:"Adam", T:"Eric"},
  {id:7,G:"Matt",  T:"Shane"}, {id:8,G:"Tal",  T:"Trevor"},
];

// ─── SCORING ─────────────────────────────────────────────────────────────────

function calcR1(r1={}) {
  let G=0,T=0;
  Object.values(r1).forEach(g=>{
    ["BB","SH","AS"].forEach(f=>{
      if(g[f]==="G")G+=1; else if(g[f]==="T")T+=1;
      else if(g[f]==="tie"){G+=0.5;T+=0.5;}
    });
  });
  return {G,T};
}
function calcR2(r2={bb:null,matches:[]}) {
  let G=0,T=0;
  if(r2.bb==="G")G+=4; else if(r2.bb==="T")T+=4;
  else if(r2.bb==="tie"){G+=2;T+=2;}
  (r2.matches||[]).forEach(m=>{
    if(m==="G")G+=2; else if(m==="T")T+=2;
    else if(m==="tie"){G+=1;T+=1;}
  });
  return {G,T};
}
function calcR3(r3=[]) {
  let G=0,T=0;
  r3.forEach(m=>{
    if(m==="G")G+=3; else if(m==="T")T+=3;
    else if(m==="tie"){G+=1.5;T+=1.5;}
  });
  return {G,T};
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const gc = "#1d6b35"; // golf green
const gold = "#c9a84c";
const dark = "#0f1f0f";
const cream = "#f8f6f1";

const S = {
  app:{fontFamily:"'Georgia',serif",background:cream,minHeight:"100vh",color:"#1a1a1a"},
  hdr:{background:dark,textAlign:"center",padding:"24px 16px 16px",borderBottom:`3px solid ${gold}`},
  logo:{height:"110px",objectFit:"contain",marginBottom:"6px"},
  venue:{fontSize:"10px",letterSpacing:"0.22em",color:gold,opacity:0.85,textTransform:"uppercase",marginTop:4},
  sub:{fontSize:"11px",letterSpacing:"0.18em",color:gold,textTransform:"uppercase",marginTop:3},
  nav:{display:"flex",justifyContent:"center",flexWrap:"wrap",background:"#0a150a",borderBottom:"1px solid #1e3a1e"},
  nb:(a)=>({
    padding:"10px 14px",fontSize:"11px",letterSpacing:"0.1em",textTransform:"uppercase",
    fontFamily:"inherit",border:"none",cursor:"pointer",fontWeight:a?"bold":"normal",
    background:a?gold:"transparent",color:a?dark:"#777",transition:"all 0.12s",
  }),
  main:{maxWidth:820,margin:"0 auto",padding:"20px 14px"},
  card:{background:"#fff",border:"1px solid #ddd",borderRadius:3,marginBottom:14,overflow:"hidden"},
  ch:()=>({background:dark,color:"#fff",padding:"10px 16px",fontSize:"11px",letterSpacing:"0.1em",
    textTransform:"uppercase",fontWeight:"bold",display:"flex",justifyContent:"space-between",alignItems:"center"}),
  tbl:{width:"100%",borderCollapse:"collapse",fontSize:"13px"},
  th:(c)=>({background:"#f0ede6",padding:"7px 10px",textAlign:"center",borderBottom:"1px solid #ddd",
    fontSize:"10px",letterSpacing:"0.08em",textTransform:"uppercase",color:c||"#666"}),
  td:{padding:"8px 10px",textAlign:"center",borderBottom:"1px solid #f5f2ec"},
  board:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14},
  team:(t)=>({background:t==="G"?"#152815":"#151528",color:"#fff",borderRadius:3,padding:"18px 12px",textAlign:"center"}),
  big:{fontSize:"clamp(44px,10vw,60px)",fontWeight:"bold",lineHeight:1,color:gold},
  tn:{fontSize:"10px",letterSpacing:"0.15em",textTransform:"uppercase",marginTop:5,opacity:0.8},
  wb:(a,t)=>({
    padding:"6px 12px",fontSize:"11px",fontWeight:"bold",
    border:`2px solid ${a?(t==="G"?gc:t==="T"?"#2a2a6a":"#555"):"#ddd"}`,
    background:a?(t==="G"?gc:t==="T"?"#2a2a6a":"#555"):"#fff",
    color:a?"#fff":"#bbb",borderRadius:3,cursor:"pointer",marginRight:4,
    fontFamily:"inherit",transition:"all 0.1s",
  }),
  note:{fontSize:"12px",color:"#555",lineHeight:1.65,marginBottom:12,background:"#f5f2ec",
    padding:"10px 14px",borderRadius:3,border:"1px solid #e8e4dc"},
  lbl:{fontSize:"10px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#999",
    margin:"16px 0 6px",borderBottom:"1px solid #e8e4dc",paddingBottom:5},
  badge:(c)=>({display:"inline-block",padding:"2px 6px",borderRadius:2,fontSize:"9px",fontWeight:"bold",
    background:c==="BB"?"#e4ede4":c==="SH"?"#e4e4ed":"#ede8e0",
    color:c==="BB"?"#1a4a1a":c==="SH"?"#1a1a4a":"#4a2a0a",marginLeft:5}),
  saving:{position:"fixed",bottom:16,right:16,background:gc,color:"#fff",padding:"6px 14px",
    borderRadius:20,fontSize:"11px",letterSpacing:"0.08em",zIndex:999,
    boxShadow:"0 2px 8px rgba(0,0,0,0.3)"},
};

// ─── WINNER SELECT ────────────────────────────────────────────────────────────

function WS({value,onChange}) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
      {[["G","Team G"],["T","Team T"],["tie","Tie"]].map(([v,lbl])=>(
        <button key={v} style={S.wb(value===v,v)} onClick={()=>onChange(value===v?null:v)}>{lbl}</button>
      ))}
    </div>
  );
}

// ─── SCOREBOARD ───────────────────────────────────────────────────────────────

function Scoreboard({scores}) {
  const {r1={},r2={bb:null,matches:[]},r3=[],euchre=null} = scores;
  const p1=calcR1(r1), p2=calcR2(r2), p3=calcR3(r3);
  const eg={G:euchre==="G"?0.5:euchre==="tie"?0.25:0, T:euchre==="T"?0.5:euchre==="tie"?0.25:0};
  const tot={G:p1.G+p2.G+p3.G+eg.G, T:p1.T+p2.T+p3.T+eg.T};
  const leading = tot.G>tot.T?"G":tot.T>tot.G?"T":null;

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

      {leading && (tot.G>0||tot.T>0) && (
        <div style={{textAlign:"center",marginBottom:12,padding:"8px 12px",background:gold,
          borderRadius:3,fontSize:"12px",fontWeight:"bold",letterSpacing:"0.1em",textTransform:"uppercase"}}>
          {TEAMS[leading].name} leads by {Math.abs(tot.G-tot.T)} {Math.abs(tot.G-tot.T)===1?"pt":"pts"}
        </div>
      )}

      <div style={S.card}>
        <table style={S.tbl}>
          <thead>
            <tr>
              <th style={{...S.th(),textAlign:"left",paddingLeft:14}}>Round</th>
              <th style={S.th()}>Avail</th>
              <th style={S.th("#1a4a1a")}>Geissy</th>
              <th style={S.th("#1a1a4a")}>Titti</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Round 1 – Woodlands",12,p1.G,p1.T],
              ["Round 2 – Links",12,p2.G,p2.T],
              ["Round 3 – Links (Match Play)",24,p3.G,p3.T],
              ["Euchre Tiebreaker",0.5,eg.G,eg.T],
            ].map(([lbl,av,g,t])=>(
              <tr key={lbl}>
                <td style={{...S.td,textAlign:"left",paddingLeft:14,fontSize:12}}>{lbl}</td>
                <td style={S.td}>{av}</td>
                <td style={{...S.td,fontWeight:"bold",color:"#1a4a1a"}}>{g||0}</td>
                <td style={{...S.td,fontWeight:"bold",color:"#1a1a4a"}}>{t||0}</td>
              </tr>
            ))}
            <tr style={{background:"#f5f2ec"}}>
              <td style={{...S.td,textAlign:"left",paddingLeft:14,fontWeight:"bold",fontSize:13}}>TOTAL</td>
              <td style={{...S.td,fontWeight:"bold"}}>48.5</td>
              <td style={{...S.td,fontWeight:"bold",color:"#1a4a1a",fontSize:16}}>{tot.G}</td>
              <td style={{...S.td,fontWeight:"bold",color:"#1a1a4a",fontSize:16}}>{tot.T}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={S.lbl}>Players</div>
      <div style={S.card}>
        <table style={S.tbl}>
          <thead>
            <tr>
              <th style={{...S.th("#1a4a1a"),width:"50%"}}>Team Geissy</th>
              <th style={S.th("#1a1a4a")}>Team Titti</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({length:8},(_,i)=>{
              const gp=Object.keys(PLAYERS).filter(p=>PLAYERS[p].team==="G");
              const tp=Object.keys(PLAYERS).filter(p=>PLAYERS[p].team==="T");
              return (
                <tr key={i}>
                  <td style={{...S.td,color:"#1a4a1a",fontWeight:"bold"}}>{gp[i]}</td>
                  <td style={{...S.td,color:"#1a1a4a",fontWeight:"bold"}}>{tp[i]}</td>
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
  const set=(gid,fmt,val)=>{
    const next={...r1,[gid]:{...(r1[gid]||{}),[fmt]:val}};
    update({...scores,r1:next});
  };
  return (
    <div>
      <div style={S.note}>
        <strong>Lawsonia Woodlands · Sunday Morning</strong><br/>
        H. 1–6: Best Ball &nbsp;·&nbsp; H. 7–12: Shamble &nbsp;·&nbsp; H. 13–18: Alt Shot<br/>
        1 pt per format win per group · <strong>12 pts available</strong>
      </div>
      <MiniScore pts={pts}/>
      {R1_GROUPS.map(grp=>{
        const d=r1[grp.id]||{};
        const gp=grp.players.filter(p=>PLAYERS[p]?.team==="G");
        const tp=grp.players.filter(p=>PLAYERS[p]?.team==="T");
        return (
          <div key={grp.id} style={S.card}>
            <div style={S.ch()}>
              <span>Group {grp.id} · {grp.tee}</span>
              <span style={{fontSize:11,opacity:0.75}}>
                <span style={{color:"#7fc97f"}}>{gp.join(" & ")}</span>
                <span style={{margin:"0 6px",opacity:0.4}}>vs</span>
                <span style={{color:"#7f7fc9"}}>{tp.join(" & ")}</span>
              </span>
            </div>
            <div style={{padding:"12px 14px"}}>
              {[["BB","Best Ball (H. 1–6)"],["SH","Shamble (H. 7–12)"],["AS","Alt Shot (H. 13–18)"]].map(([f,lbl])=>(
                <div key={f} style={{display:"flex",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                  <span style={{fontSize:12,minWidth:165}}>{lbl}<span style={S.badge(f)}>{f}</span></span>
                  <div style={{marginLeft:"auto"}}><WS value={d[f]||null} onChange={v=>set(grp.id,f,v)}/></div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ROUND 2 ─────────────────────────────────────────────────────────────────

function R2Tab({scores,update}) {
  const r2 = scores.r2||{bb:null,matches:[null,null,null,null]};
  const pts = calcR2(r2);
  const setM=(i,v)=>{
    const m=[...(r2.matches||[null,null,null,null])];
    m[i]=v;
    update({...scores,r2:{...r2,matches:m}});
  };
  return (
    <div>
      <div style={S.note}>
        <strong>Lawsonia Links · Sunday Afternoon</strong><br/>
        2-man scrambles · Best Ball Scorecard (4 pts) + 2v2 Stroke Play Matches (2 pts each)<br/>
        <strong>12 pts available</strong>
      </div>
      <MiniScore pts={pts}/>
      <div style={S.card}>
        <div style={S.ch()}>Best Ball Scorecard Winner <span style={{fontSize:11,opacity:0.6,marginLeft:6}}>— 4 pts</span></div>
        <div style={{padding:"12px 14px"}}>
          <WS value={r2.bb||null} onChange={v=>update({...scores,r2:{...r2,bb:v}})}/>
        </div>
      </div>
      <div style={S.lbl}>2v2 Stroke Play Matches — 2 pts each</div>
      {R2_GROUPS.map((grp,i)=>(
        <div key={grp.id} style={S.card}>
          <div style={S.ch()}>
            <span>Group {grp.id} · {grp.tee}</span>
            <span style={{fontSize:11,opacity:0.75}}>
              <span style={{color:"#7fc97f"}}>{grp.G.join(" & ")}</span>
              <span style={{margin:"0 6px",opacity:0.4}}>vs</span>
              <span style={{color:"#7f7fc9"}}>{grp.T.join(" & ")}</span>
            </span>
          </div>
          <div style={{padding:"12px 14px"}}>
            <WS value={(r2.matches||[])[i]||null} onChange={v=>setM(i,v)}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ROUND 3 ─────────────────────────────────────────────────────────────────

function R3Tab({scores,update}) {
  const r3 = scores.r3||Array(8).fill(null);
  const pts = calcR3(r3);
  const set=(i,v)=>{
    const a=[...r3];
    a[i]=v;
    update({...scores,r3:a});
  };
  return (
    <div>
      <div style={S.note}>
        <strong>Lawsonia Links · Monday Morning</strong><br/>
        Eight 1v1 individual match play matches · 3 pts per match<br/>
        <strong>24 pts available</strong>
      </div>
      <MiniScore pts={pts}/>
      {R3_MATCHES.map((m,i)=>(
        <div key={m.id} style={S.card}>
          <div style={S.ch()}>
            <span>Match {m.id}</span>
            <span style={{fontSize:12,opacity:0.85}}>
              <span style={{color:"#7fc97f"}}>{m.G}</span>
              <span style={{margin:"0 8px",opacity:0.4}}>vs</span>
              <span style={{color:"#7f7fc9"}}>{m.T}</span>
            </span>
          </div>
          <div style={{padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <WS value={r3[i]||null} onChange={v=>set(i,v)}/>
            <span style={{fontSize:11,color:"#aaa"}}>3 pts to winner</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── EUCHRE ──────────────────────────────────────────────────────────────────

function EuchreTab({scores,update}) {
  return (
    <div>
      <div style={S.note}>
        <strong>Sunday Evening — Tiebreaker</strong><br/>
        One game of Euchre · 0.5 pts to the winner
      </div>
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
        <table style={S.tbl}>
          <tbody>
            {[
              ["Lodging — Venmo Drew","$65.63/person"],
              ["Golf Sunday (Replay Rate) — Pay at Course","$185/person"],
              ["Golf Monday (Single Round) — Pay at Course","$120/person"],
              ["Food & Catering — Venmo Drew","$40/person"],
              ["Prize Pool Contribution — Venmo Drew","$125/person"],
              ["All-In Total","$535.63/person"],
            ].map(([k,v])=>(
              <tr key={k}>
                <td style={{...S.td,textAlign:"left",paddingLeft:14,fontSize:12}}>{k}</td>
                <td style={{...S.td,fontWeight:"bold"}}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.lbl}>Prize Payouts — $2,000 Pool</div>
      <div style={S.card}>
        <table style={S.tbl}>
          <tbody>
            {[
              ["🏆 Team Win","$1,600","$200 × 8 players"],
              ["🎯 Net Low Score Monday","$100","Score less agreed handicap"],
              ["🌀 Low 2-Man Scramble Score","$150","$75 per player"],
              ["📏 Largest Sun AM Win Margin","$150","$75 per player"],
            ].map(([k,v,n])=>(
              <tr key={k}>
                <td style={{...S.td,textAlign:"left",paddingLeft:14,fontSize:12}}>{k}</td>
                <td style={{...S.td,fontWeight:"bold"}}>{v}</td>
                <td style={{...S.td,color:"#999",fontSize:11}}>{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.lbl}>Tee Times · Round 1 — Woodlands (Sunday AM)</div>
      <div style={S.card}>
        <table style={S.tbl}>
          <thead><tr>
            <th style={S.th()}>Group</th><th style={S.th()}>Tee</th>
            <th style={S.th("#1a4a1a")}>Team Geissy</th>
            <th style={S.th("#1a1a4a")}>Team Titti</th>
          </tr></thead>
          <tbody>
            {R1_GROUPS.map(g=>(
              <tr key={g.id}>
                <td style={S.td}>{g.id}</td>
                <td style={S.td}>{g.tee}</td>
                <td style={{...S.td,color:"#1a4a1a",fontWeight:"bold"}}>{g.players.filter(p=>PLAYERS[p]?.team==="G").join(", ")}</td>
                <td style={{...S.td,color:"#1a1a4a",fontWeight:"bold"}}>{g.players.filter(p=>PLAYERS[p]?.team==="T").join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.lbl}>Tee Times · Round 2 — Links (Sunday PM)</div>
      <div style={S.card}>
        <table style={S.tbl}>
          <thead><tr>
            <th style={S.th()}>Group</th><th style={S.th()}>Tee</th>
            <th style={S.th("#1a4a1a")}>Team Geissy</th>
            <th style={S.th("#1a1a4a")}>Team Titti</th>
          </tr></thead>
          <tbody>
            {R2_GROUPS.map(g=>(
              <tr key={g.id}>
                <td style={S.td}>{g.id}</td>
                <td style={S.td}>{g.tee}</td>
                <td style={{...S.td,color:"#1a4a1a",fontWeight:"bold"}}>{g.G.join(", ")}</td>
                <td style={{...S.td,color:"#1a1a4a",fontWeight:"bold"}}>{g.T.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.lbl}>Side Games (Optional)</div>
      <div style={S.card}>
        <table style={S.tbl}>
          <thead><tr>
            <th style={{...S.th(),textAlign:"left",paddingLeft:14}}>Game</th>
            <th style={S.th()}>Stakes</th>
            <th style={{...S.th(),textAlign:"left"}}>How it Works</th>
          </tr></thead>
          <tbody>
            {[
              ["Skins","$1–5/skin","Lowest score per hole wins. Ties carry over."],
              ["Snake","$5–20 total","3-putt gets the snake. Last holder at end pays."],
              ["Rabbit","$5–10/rabbit","Win a hole outright to catch it. Hold at turn/end to win."],
            ].map(([g,s,d])=>(
              <tr key={g}>
                <td style={{...S.td,textAlign:"left",paddingLeft:14,fontWeight:"bold"}}>{g}</td>
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

// ─── MINI SCORE COMPONENT ────────────────────────────────────────────────────

function MiniScore({pts}) {
  return (
    <div style={{display:"flex",gap:10,marginBottom:12}}>
      {["G","T"].map(t=>(
        <div key={t} style={{background:t==="G"?"#e4ede4":"#e4e4ed",padding:"7px 14px",borderRadius:3,textAlign:"center",minWidth:80}}>
          <div style={{fontSize:20,fontWeight:"bold",color:t==="G"?"#1a4a1a":"#1a1a4a"}}>{pts[t]||0}</div>
          <div style={{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:"#777"}}>{TEAMS[t].name}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const DEFAULT_SCORES = {
  r1:{}, r2:{bb:null,matches:[null,null,null,null]},
  r3:Array(8).fill(null), euchre:null
};

export default function App() {
  const [tab,   setTab]   = useState("board");
  const [scores,setScores]= useState(DEFAULT_SCORES);
  const [saving,setSaving]= useState(false);
  const [loaded,setLoaded]= useState(false);

  // Load scores from Supabase on mount
  useEffect(()=>{
    async function load() {
      const {data,error} = await supabase
        .from("scores").select("*").eq("id",1).single();
      if(data?.payload) setScores(data.payload);
      setLoaded(true);
    }
    load();
  },[]);

  // Subscribe to real-time changes
  useEffect(()=>{
    const channel = supabase
      .channel("scores-channel")
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"scores"},
        payload=>{ if(payload.new?.payload) setScores(payload.new.payload); }
      ).subscribe();
    return ()=>supabase.removeChannel(channel);
  },[]);

  // Save scores to Supabase
  const save = useCallback(async(next)=>{
    setScores(next);
    setSaving(true);
    await supabase.from("scores").upsert({id:1,payload:next});
    setTimeout(()=>setSaving(false),800);
  },[]);

  const tabs=[
    {id:"board",label:"Leaderboard"},
    {id:"r1",   label:"Round 1"},
    {id:"r2",   label:"Round 2"},
    {id:"r3",   label:"Round 3"},
    {id:"euchre",label:"Euchre"},
    {id:"info", label:"Info"},
  ];

  if(!loaded) return (
    <div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <div style={{textAlign:"center",color:"#666",fontSize:13,letterSpacing:"0.1em"}}>Loading...</div>
    </div>
  );

  return (
    <div style={S.app}>
      <header style={S.hdr}>
        <img src="/logo.jpg" alt="Garbage Classic" style={S.logo}/>
        <div style={S.venue}>Lawsonia Golf Resort · Green Lake, WI</div>
        <div style={S.sub}>June 28–29, 2026</div>
      </header>
      <nav style={S.nav}>
        {tabs.map(t=>(
          <button key={t.id} style={S.nb(tab===t.id)} onClick={()=>setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main style={S.main}>
        {tab==="board"   && <Scoreboard scores={scores}/>}
        {tab==="r1"      && <R1Tab scores={scores} update={save}/>}
        {tab==="r2"      && <R2Tab scores={scores} update={save}/>}
        {tab==="r3"      && <R3Tab scores={scores} update={save}/>}
        {tab==="euchre"  && <EuchreTab scores={scores} update={save}/>}
        {tab==="info"    && <InfoTab/>}
      </main>
      <footer style={{textAlign:"center",padding:16,fontSize:9,color:"#aaa",letterSpacing:"0.14em",
        borderTop:"1px solid #e0dcd4",textTransform:"uppercase"}}>
        Garbage Golf. Great Friends. · Est. 2022
      </footer>
      {saving && <div style={S.saving}>✓ Saved</div>}
    </div>
  );
}

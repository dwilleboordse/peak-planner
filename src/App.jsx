import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════

const C = {
  bg: "#000", surface: "#0d0d0d", surface2: "#161616", surface3: "#1c1c1e",
  card: "#1c1c1e", border: "rgba(255,255,255,0.08)", borderLight: "rgba(255,255,255,0.12)",
  text: "#f5f5f7", textSecondary: "#86868b", textTertiary: "#48484a",
  accent: "#0a84ff", green: "#30d158", red: "#ff453a", orange: "#ff9f0a",
  purple: "#bf5af2", teal: "#64d2ff", yellow: "#ffd60a", pink: "#ff375f",
};

const TYPE_COLORS = { global: C.accent, regional: C.purple, industry: C.teal, custom: C.pink };
const PHASE_COLORS = { teaser: C.purple, launch: C.green, peak: C.orange, last_call: C.red, post: C.teal };
const PHASE_LABELS = { teaser: "Teaser", launch: "Launch", peak: "Peak", last_call: "Last Call", post: "Post-Event" };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const css = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased}
  ::selection{background:${C.accent}40}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.textTertiary};border-radius:3px}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fade-in{animation:fadeIn 0.4s ease-out forwards}
`;

const BASE_EVENTS = [
  { id:"nye", name:"New Year's Day", date:"01-01", type:"global", regions:["Global"] },
  { id:"cny", name:"Chinese New Year", date:"01-29", type:"regional", regions:["APAC","Global"] },
  { id:"valentines", name:"Valentine's Day", date:"02-14", type:"global", regions:["Global"] },
  { id:"intl-womens", name:"International Women's Day", date:"03-08", type:"global", regions:["Global"] },
  { id:"st-patrick", name:"St. Patrick's Day", date:"03-17", type:"regional", regions:["US","EU","UK"] },
  { id:"easter", name:"Easter", date:"04-20", type:"global", regions:["Global"] },
  { id:"kingsday", name:"King's Day (NL)", date:"04-27", type:"regional", regions:["NL","EU"] },
  { id:"mothers-day", name:"Mother's Day", date:"05-11", type:"global", regions:["US","EU","Global"] },
  { id:"memorial-day", name:"Memorial Day (US)", date:"05-26", type:"regional", regions:["US"] },
  { id:"fathers-day", name:"Father's Day", date:"06-15", type:"global", regions:["US","EU","Global"] },
  { id:"july4", name:"4th of July", date:"07-04", type:"regional", regions:["US"] },
  { id:"prime-day", name:"Amazon Prime Day", date:"07-15", type:"industry", regions:["Global"] },
  { id:"back-school", name:"Back to School", date:"08-15", type:"industry", regions:["US","EU","Global"] },
  { id:"labor-day", name:"Labor Day (US)", date:"09-01", type:"regional", regions:["US"] },
  { id:"singles-day", name:"Singles' Day (11.11)", date:"11-11", type:"global", regions:["APAC","Global"] },
  { id:"bfcm", name:"Black Friday / Cyber Monday", date:"11-28", type:"global", regions:["Global"] },
  { id:"giving-tues", name:"Giving Tuesday", date:"12-02", type:"global", regions:["US","Global"] },
  { id:"christmas", name:"Christmas", date:"12-25", type:"global", regions:["Global"] },
  { id:"boxing-day", name:"Boxing Day", date:"12-26", type:"regional", regions:["UK","AU","EU"] },
  { id:"nye-eve", name:"New Year's Eve", date:"12-31", type:"global", regions:["Global"] },
];

const NICHES = ["Skincare / Beauty","Health & Supplements","Fitness / Activewear","Fashion / Apparel","Home & Kitchen","Pet Products","Food & Beverage","Baby & Kids","Electronics / Gadgets","Jewelry & Accessories","Outdoor / Sports","Other"];
const REGIONS = ["Global","US","EU","UK","NL","APAC","AU","LATAM","Middle East"];

const genId = () => Math.random().toString(36).substring(2, 10);
const genToken = () => Math.random().toString(36).substring(2, 14);
const sortEvents = (a, b) => { const am=parseInt(a.date.split("-")[0]),bm=parseInt(b.date.split("-")[0]),ad=parseInt(a.date.split("-")[1]),bd=parseInt(b.date.split("-")[1]); return am!==bm?am-bm:ad-bd; };

// ═══════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════

const SYS = `You are an elite eCommerce growth strategist. Generate campaign plans for calendar events.

Respond ONLY in valid JSON:
{
  "niche_events": [{ "id":"unique","name":"Event","date":"MM-DD","type":"industry","regions":["regions"],"why":"relevance" }],
  "plans": [{
    "event_id":"id",
    "relevance":"high/medium/low",
    "relevance_reason":"why",
    "summary":"strategy",
    "budget_pct":"30%",
    "phases": {
      "teaser":{"days_before":14,"description":"what to do","ad_angles":["angle"],"hooks":["hook"],"email_sms":"strategy"},
      "launch":{"days_before":0,"description":"launch","ad_angles":["angle"],"hooks":["hook"],"email_sms":"strategy"},
      "peak":{"days_after":1,"duration_days":2,"description":"peak","ad_angles":["angle"],"hooks":["hook"],"email_sms":"strategy"},
      "last_call":{"days_before_end":1,"description":"urgency","ad_angles":["angle"],"hooks":["hook"],"email_sms":"strategy"},
      "post":{"days_after_end":1,"duration_days":5,"description":"follow up","ad_angles":["angle"],"hooks":["hook"],"email_sms":"strategy"}
    },
    "offer_suggestions":["offer"],
    "creative_formats":["format"]
  }]
}

Generate 3-6 niche-specific events. Create plans for ALL events. Be specific to the niche. Hooks should be ready-to-use. Phase timelines realistic.`;

// ═══════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════

async function loadData() {
  try { const r = await fetch("/api/data"); if(!r.ok) throw new Error(); return await r.json(); }
  catch(e) { return { clients: [] }; }
}
async function saveData(d) {
  try { await fetch("/api/data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}); } catch(e) { console.error(e); }
}

// ═══════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════

function Button({children,onClick,variant="secondary",size="md",disabled,fullWidth}) {
  const v={primary:{bg:C.accent,c:"#fff",b:"none"},secondary:{bg:C.surface3,c:C.text,b:`1px solid ${C.border}`},ghost:{bg:"transparent",c:C.textSecondary,b:"none"},danger:{bg:C.red+"18",c:C.red,b:`1px solid ${C.red}30`}};
  const s={sm:{p:"6px 14px",f:12},md:{p:"10px 20px",f:14},lg:{p:"14px 28px",f:15}};
  const vv=v[variant]||v.secondary,ss=s[size]||s.md;
  return <button onClick={onClick} disabled={disabled} style={{padding:ss.p,fontSize:ss.f,fontFamily:"inherit",fontWeight:500,borderRadius:10,cursor:disabled?"default":"pointer",opacity:disabled?0.35:1,transition:"all 0.2s",width:fullWidth?"100%":"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,background:vv.bg,color:vv.c,border:vv.b,letterSpacing:"-0.01em"}}>{children}</button>;
}

function Input({label,value,onChange,placeholder,type="text",textarea,rows=3,hint}) {
  const sh={width:"100%",fontFamily:"inherit",fontSize:14,color:C.text,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",outline:"none",transition:"border-color 0.2s"};
  return <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:12,fontWeight:500,color:C.textSecondary,marginBottom:hint?2:6}}>{label}</label>}
    {hint&&<div style={{fontSize:11,color:C.textTertiary,marginBottom:6}}>{hint}</div>}
    {textarea?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...sh,resize:"vertical",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
    :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={sh} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>}
  </div>;
}

function Pill({children,color,onClick,active}) {
  return <button onClick={onClick} style={{fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:16,cursor:onClick?"pointer":"default",transition:"all 0.15s",fontFamily:"inherit",background:(active!==undefined?active:true)?(color||C.accent)+"15":"transparent",color:(active!==undefined?active:true)?(color||C.accent):C.textTertiary,border:`1px solid ${(active!==undefined?active:true)?(color||C.accent)+"40":C.border}`,whiteSpace:"nowrap"}}>{children}</button>;
}

function Modal({children,onClose,title}) {
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
    <div onClick={e=>e.stopPropagation()} className="fade-in" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:17,fontWeight:600,letterSpacing:"-0.02em"}}>{title}</div>
        <button onClick={onClose} style={{width:28,height:28,borderRadius:14,background:C.surface3,border:"none",color:C.textSecondary,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{padding:24}}>{children}</div>
    </div>
  </div>;
}

function PhaseBlock({phase,data}) {
  if(!data) return null;
  const color=PHASE_COLORS[phase]||C.accent;
  return <div style={{background:C.surface2,borderRadius:12,padding:14,marginBottom:8,borderLeft:`3px solid ${color}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <span style={{fontSize:13,fontWeight:700,color}}>{PHASE_LABELS[phase]}</span>
      {data.days_before!==undefined&&<span style={{fontSize:11,color:C.textTertiary}}>{data.days_before===0?"Event day":`${data.days_before}d before`}</span>}
      {data.days_after!==undefined&&<span style={{fontSize:11,color:C.textTertiary}}>{data.days_after}d after · {data.duration_days}d</span>}
      {data.days_after_end!==undefined&&<span style={{fontSize:11,color:C.textTertiary}}>{data.days_after_end}d after end · {data.duration_days}d</span>}
      {data.days_before_end!==undefined&&<span style={{fontSize:11,color:C.textTertiary}}>{data.days_before_end}d before end</span>}
    </div>
    <div style={{fontSize:13,color:C.textSecondary,lineHeight:1.5,marginBottom:8}}>{data.description}</div>
    {data.ad_angles?.length>0&&<div style={{marginBottom:6}}><div style={{fontSize:10,fontWeight:600,color:C.textTertiary,marginBottom:4}}>AD ANGLES</div>{data.ad_angles.map((a,i)=><div key={i} style={{fontSize:12,color:C.textSecondary,paddingLeft:10,marginBottom:2}}>- {a}</div>)}</div>}
    {data.hooks?.length>0&&<div style={{marginBottom:6}}><div style={{fontSize:10,fontWeight:600,color:C.textTertiary,marginBottom:4}}>HOOKS</div>{data.hooks.map((h,i)=><div key={i} style={{fontSize:12,color:C.text,fontStyle:"italic",paddingLeft:10,marginBottom:2}}>"{h}"</div>)}</div>}
    {data.email_sms&&<div><div style={{fontSize:10,fontWeight:600,color:C.textTertiary,marginBottom:4}}>EMAIL / SMS</div><div style={{fontSize:12,color:C.textSecondary,lineHeight:1.4}}>{data.email_sms}</div></div>}
  </div>;
}

function EventCard({event,plan}) {
  const [exp,setExp]=useState(false);
  const tc=TYPE_COLORS[event.type]||C.accent;
  const rc=plan?.relevance==="high"?C.green:plan?.relevance==="medium"?C.orange:C.textTertiary;
  const mi=parseInt(event.date.split("-")[0])-1, day=parseInt(event.date.split("-")[1]);
  return <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,marginBottom:8,overflow:"hidden"}}>
    <div onClick={()=>plan&&setExp(!exp)} style={{padding:"16px 20px",cursor:plan?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,flex:1}}>
        <div style={{textAlign:"center",minWidth:40}}>
          <div style={{fontSize:10,fontWeight:600,color:C.textTertiary}}>{MONTHS[mi]}</div>
          <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.03em"}}>{day}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:600,letterSpacing:"-0.02em"}}>{event.name}</div>
          <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
            <Pill color={tc}>{event.type}</Pill>
            {event.submittedBy&&<Pill color={C.pink}>Client submitted</Pill>}
          </div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {plan&&<><span style={{fontSize:12,fontWeight:600,color:rc}}>{plan.relevance}</span>{plan.budget_pct&&<span style={{fontSize:12,fontWeight:600,color:C.accent}}>{plan.budget_pct}</span>}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth="2" style={{transform:exp?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg></>}
        {!plan&&<span style={{fontSize:11,color:C.textTertiary}}>No plan yet</span>}
      </div>
    </div>
    {exp&&plan&&<div style={{padding:"0 20px 20px",borderTop:`1px solid ${C.border}`}}>
      <div style={{padding:"14px 0",fontSize:14,color:C.textSecondary,lineHeight:1.6}}>{plan.summary}</div>
      {plan.relevance_reason&&<div style={{fontSize:12,color:C.textTertiary,marginBottom:14,fontStyle:"italic"}}>{plan.relevance_reason}</div>}
      <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        {plan.offer_suggestions?.length>0&&<div style={{flex:1,minWidth:200}}><div style={{fontSize:10,fontWeight:600,color:C.textTertiary,marginBottom:6}}>OFFER IDEAS</div>{plan.offer_suggestions.map((o,i)=><div key={i} style={{fontSize:12,color:C.textSecondary,marginBottom:2}}>- {o}</div>)}</div>}
        {plan.creative_formats?.length>0&&<div style={{flex:1,minWidth:200}}><div style={{fontSize:10,fontWeight:600,color:C.textTertiary,marginBottom:6}}>FORMATS</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{plan.creative_formats.map((f,i)=><Pill key={i} color={C.teal}>{f}</Pill>)}</div></div>}
      </div>
      <div style={{fontSize:12,fontWeight:600,color:C.textSecondary,marginBottom:10}}>Campaign Phases</div>
      {["teaser","launch","peak","last_call","post"].map(p=><PhaseBlock key={p} phase={p} data={plan.phases?.[p]}/>)}
    </div>}
  </div>;
}

// ═══════════════════════════════════════════
// CALENDAR VIEW (shared between admin & client)
// ═══════════════════════════════════════════

function CalendarView({ client, onAddEvent, isClientView }) {
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const events = client.events || [];
  const plans = client.plans || {};

  const filtered = events.filter(e => {
    if (filterMonth !== "all" && parseInt(e.date.split("-")[0]) !== parseInt(filterMonth)) return false;
    if (filterType !== "all" && e.type !== filterType) return false;
    return true;
  });

  const monthCounts = {};
  events.forEach(e => { const m = parseInt(e.date.split("-")[0]); monthCounts[m] = (monthCounts[m] || 0) + 1; });
  const maxCount = Math.max(...Object.values(monthCounts), 1);

  const byMonth = {};
  filtered.forEach(e => { const m = parseInt(e.date.split("-")[0]); if (!byMonth[m]) byMonth[m] = []; byMonth[m].push(e); });

  return (
    <div>
      {/* Month mini-map */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {MONTHS.map((m, i) => {
          const count = monthCounts[i + 1] || 0;
          const active = filterMonth === "all" || parseInt(filterMonth) === i + 1;
          return <button key={m} onClick={() => setFilterMonth(filterMonth === String(i + 1) ? "all" : String(i + 1))} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${parseInt(filterMonth) === i + 1 ? C.accent + "40" : C.border}`,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            background: parseInt(filterMonth) === i + 1 ? C.accent + "20" : C.surface2,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: active ? C.textSecondary : C.textTertiary }}>{m}</div>
            {count > 0 && <div style={{ height: 3, borderRadius: 1.5, margin: "4px 4px 0", background: C.accent, opacity: active ? 1 : 0.3, transform: `scaleX(${Math.max(count / maxCount, 0.15)})`, transformOrigin: "left" }} />}
            {count > 0 && <div style={{ fontSize: 9, color: C.textTertiary, marginTop: 2 }}>{count}</div>}
          </button>;
        })}
      </div>

      {/* Type filter + add event */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Pill active={filterType === "all"} onClick={() => setFilterType("all")}>All ({events.length})</Pill>
          {["global", "regional", "industry", "custom"].map(t => {
            const count = events.filter(e => e.type === t).length;
            return count > 0 ? <Pill key={t} active={filterType === t} onClick={() => setFilterType(filterType === t ? "all" : t)} color={TYPE_COLORS[t]}>{t} ({count})</Pill> : null;
          })}
        </div>
        {onAddEvent && <Button variant="primary" size="sm" onClick={onAddEvent}>Add Event</Button>}
      </div>

      {/* Events */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: C.textTertiary }}>No events match your filters.</div>
      ) : Object.keys(byMonth).sort((a, b) => a - b).map(m => (
        <div key={m} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 10 }}>{FULL_MONTHS[parseInt(m) - 1]}</div>
          {byMonth[m].map(e => <EventCard key={e.id} event={e} plan={plans[e.id]} />)}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// CLIENT VIEW (share link)
// ═══════════════════════════════════════════

function ClientShareView({ client, data, onSave }) {
  const [showAdd, setShowAdd] = useState(false);
  const [evtName, setEvtName] = useState("");
  const [evtDate, setEvtDate] = useState("");
  const [evtNote, setEvtNote] = useState("");

  const submitEvent = () => {
    if (!evtName.trim() || !evtDate) return;
    const parts = evtDate.split("-");
    const mmdd = parts[1] + "-" + parts[2];
    const newEvent = { id: "client-" + genId(), name: evtName.trim(), date: mmdd, type: "custom", regions: client.regions || ["Global"], submittedBy: "client", note: evtNote };
    const updatedClient = { ...client, events: [...(client.events || []), newEvent].sort(sortEvents) };
    const updatedData = { ...data, clients: data.clients.map(c => c.id === client.id ? updatedClient : c) };
    onSave(updatedData);
    setShowAdd(false); setEvtName(""); setEvtDate(""); setEvtNote("");
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{css}</style>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(20px) saturate(180%)", borderBottom: `1px solid ${C.border}`, padding: "0 28px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>Peak Planner</span>
            <span style={{ fontSize: 12, color: C.textTertiary }}>D-DOUBLEU MEDIA</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>Suggest Event</Button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 28px" }} className="fade-in">
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>{client.name}</h1>
        <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 24 }}>
          {(client.events || []).length} events planned · {client.niche}
        </p>
        <CalendarView client={client} isClientView />
      </div>

      <footer style={{ padding: "24px 28px", textAlign: "center", marginTop: 40 }}>
        <p style={{ fontSize: 12, color: C.textTertiary }}>Managed by D-DOUBLEU MEDIA</p>
      </footer>

      {showAdd && (
        <Modal title="Suggest an Event" onClose={() => setShowAdd(false)}>
          <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16, lineHeight: 1.5 }}>
            Submit a product launch, sale, anniversary, or any event you'd like us to build a campaign around.
          </p>
          <Input label="Event Name" value={evtName} onChange={setEvtName} placeholder="Summer Product Launch, Brand Anniversary..." />
          <Input label="Event Date" value={evtDate} onChange={setEvtDate} type="date" />
          <Input label="Notes (optional)" value={evtNote} onChange={setEvtNote} placeholder="Any details about this event..." textarea rows={2} />
          <Button variant="primary" fullWidth onClick={submitEvent} disabled={!evtName.trim() || !evtDate}>Submit Event</Button>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP (Admin)
// ═══════════════════════════════════════════

export default function App() {
  const [data, setData] = useState({ clients: [] });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("clients"); // clients | setup | calendar
  const [selectedClient, setSelectedClient] = useState(null);
  const [shareView, setShareView] = useState(null);

  // New client form
  const [showNewClient, setShowNewClient] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [selectedRegions, setSelectedRegions] = useState(["Global"]);
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [products, setProducts] = useState("");

  // Add event
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [evtName, setEvtName] = useState("");
  const [evtDate, setEvtDate] = useState("");

  // Share
  const [shareModal, setShareModal] = useState(null);
  const [copied, setCopied] = useState(false);

  // Loading
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState(null);

  // Check share view
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#share/")) setShareView(hash.replace("#share/", ""));
    const onHash = () => {
      const h = window.location.hash;
      if (h.startsWith("#share/")) setShareView(h.replace("#share/", "")); else setShareView(null);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Load data
  useEffect(() => { loadData().then(d => { setData(d); setLoaded(true); }); }, []);

  // Auto-refresh for share views
  useEffect(() => {
    if (!shareView) return;
    const i = setInterval(() => { loadData().then(d => setData(d)); }, 30000);
    return () => clearInterval(i);
  }, [shareView]);

  const save = useCallback(async (newData) => {
    setData(newData); setSaving(true);
    await saveData(newData);
    setSaving(false);
  }, []);

  const effectiveNiche = niche === "Other" ? customNiche : niche;
  const toggleRegion = (r) => setSelectedRegions(p => p.includes(r) ? (p.length > 1 ? p.filter(x => x !== r) : p) : [...p, r]);

  // Create client
  const createClient = () => {
    if (!brandName.trim() || !effectiveNiche) return;
    const baseEvents = BASE_EVENTS
      .filter(e => e.regions.some(r => selectedRegions.includes(r) || selectedRegions.includes("Global") || r === "Global"))
      .map(e => ({ ...e }));

    const newClient = {
      id: genId(), name: brandName.trim(), niche: effectiveNiche, regions: selectedRegions,
      budget: monthlyBudget, products, shareToken: genToken(), createdAt: new Date().toISOString(),
      events: baseEvents.sort(sortEvents), plans: {},
    };
    const newData = { ...data, clients: [...data.clients, newClient] };
    save(newData);
    setSelectedClient(newClient);
    setView("calendar");
    setShowNewClient(false);
    setBrandName(""); setNiche(""); setCustomNiche(""); setSelectedRegions(["Global"]); setMonthlyBudget(""); setProducts("");

    // Generate plans
    generatePlans(newClient, newData);
  };

  const deleteClient = (id) => {
    if (!confirm("Delete this client and all their data?")) return;
    save({ ...data, clients: data.clients.filter(c => c.id !== id) });
    if (selectedClient?.id === id) { setSelectedClient(null); setView("clients"); }
  };

  // Generate plans for a client
  const generatePlans = async (client, currentData) => {
    setLoading(true); setLoadingMsg("Claude is generating campaign plans (30-60s)...");
    try {
      const evtList = (client.events || []).map(e => `- ${e.id}: ${e.name} (${e.date}, ${e.type}, regions: ${e.regions.join(",")})`).join("\n");
      const res = await fetch("/api/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 16000, system: SYS,
          messages: [{ role: "user", content: `BRAND: ${client.name}\nNiche: ${client.niche}\nMarkets: ${(client.regions||[]).join(", ")}\nBudget: ${client.budget || "N/A"}\nProducts: ${client.products || "N/A"}\n\nEVENTS:\n${evtList}\n\nGenerate niche events + plans for ALL events.` }],
        }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("Server error");
      const d = await res.json();
      if (d.error) throw new Error(typeof d.error === "string" ? d.error : d.error.message);
      let text = (d.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
      if (!text) throw new Error("Empty response.");
      // Fix truncated JSON
      if (!text.endsWith("}")) {
        const lastComplete = Math.max(text.lastIndexOf("}]"), text.lastIndexOf("}"));
        if (lastComplete > 0) {
          text = text.substring(0, lastComplete + 1);
          if (!text.endsWith("]}")) text += "]}";
          if (!text.endsWith("}")) text += "}";
        }
      }
      let parsed;
      try { parsed = JSON.parse(text); }
      catch(e2) {
        let fixed = text;
        const ob = (fixed.match(/{/g)||[]).length, cb = (fixed.match(/}/g)||[]).length;
        for (let i = 0; i < ob - cb; i++) fixed += "}";
        const oq = (fixed.match(/\[/g)||[]).length, cq = (fixed.match(/\]/g)||[]).length;
        for (let i = 0; i < oq - cq; i++) fixed += "]";
        if (!fixed.endsWith("}")) fixed += "}";
        parsed = JSON.parse(fixed);
      }

      // Add niche events
      const nicheEvts = (parsed.niche_events || []).map(e => ({ ...e, id: e.id || "niche-" + genId() }));
      const allEvents = [...(client.events || []), ...nicheEvts].sort(sortEvents);

      // Build plans map
      const planMap = { ...(client.plans || {}) };
      (parsed.plans || []).forEach(p => { planMap[p.event_id] = p; });

      const updatedClient = { ...client, events: allEvents, plans: planMap };
      const updatedData = { ...(currentData || data), clients: (currentData || data).clients.map(c => c.id === client.id ? updatedClient : c) };
      save(updatedData);
      setSelectedClient(updatedClient);
    } catch (e) { setError(e.message); }
    setLoading(false); setLoadingMsg("");
  };

  // Add custom event + generate single plan
  const addCustomEvent = async () => {
    if (!evtName.trim() || !evtDate || !selectedClient) return;
    const parts = evtDate.split("-");
    const mmdd = parts[1] + "-" + parts[2];
    const newEvent = { id: "custom-" + genId(), name: evtName.trim(), date: mmdd, type: "custom", regions: selectedClient.regions || ["Global"] };
    const updatedClient = { ...selectedClient, events: [...(selectedClient.events || []), newEvent].sort(sortEvents) };
    const updatedData = { ...data, clients: data.clients.map(c => c.id === selectedClient.id ? updatedClient : c) };
    save(updatedData);
    setSelectedClient(updatedClient);
    setShowAddEvent(false); setEvtName(""); setEvtDate("");

    // Generate plan for this event
    setLoading(true); setLoadingMsg(`Planning "${newEvent.name}"...`);
    try {
      const res = await fetch("/api/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 4000, system: SYS,
          messages: [{ role: "user", content: `BRAND: ${selectedClient.name}\nNiche: ${selectedClient.niche}\nMarkets: ${(selectedClient.regions||[]).join(", ")}\nBudget: ${selectedClient.budget||"N/A"}\nProducts: ${selectedClient.products||"N/A"}\n\nGenerate plan for ONE event:\n- ${newEvent.id}: ${newEvent.name} (${newEvent.date}, custom)\n\nReturn JSON with "niche_events":[] and "plans":[single plan].` }],
        }),
      });
      const d = await res.json();
      if (!d.error) {
        let text2 = (d.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
        if (text2 && !text2.endsWith("}")) {
          const lc = Math.max(text2.lastIndexOf("}]"), text2.lastIndexOf("}"));
          if (lc > 0) { text2 = text2.substring(0, lc + 1); if (!text2.endsWith("]}")) text2 += "]}"; if (!text2.endsWith("}")) text2 += "}"; }
        }
        let parsed2;
        try { parsed2 = JSON.parse(text2); } catch(e3) {
          let f2 = text2;
          const ob2=(f2.match(/{/g)||[]).length,cb2=(f2.match(/}/g)||[]).length;
          for(let i=0;i<ob2-cb2;i++) f2+="}";
          const oq2=(f2.match(/\[/g)||[]).length,cq2=(f2.match(/\]/g)||[]).length;
          for(let i=0;i<oq2-cq2;i++) f2+="]";
          if(!f2.endsWith("}")) f2+="}";
          parsed2 = JSON.parse(f2);
        }
        if (parsed2.plans?.[0]) {
          const newPlans = { ...updatedClient.plans, [parsed2.plans[0].event_id || newEvent.id]: parsed2.plans[0] };
          const finalClient = { ...updatedClient, plans: newPlans };
          const finalData = { ...updatedData, clients: updatedData.clients.map(c => c.id === selectedClient.id ? finalClient : c) };
          save(finalData);
          setSelectedClient(finalClient);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false); setLoadingMsg("");
  };

  const getShareUrl = (c) => `${window.location.origin}${window.location.pathname}#share/${c.shareToken}`;
  const copyShareLink = (c) => { navigator.clipboard.writeText(getShareUrl(c)); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // ═══ SHARE VIEW ═══
  if (shareView) {
    if (!loaded) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{css}</style><div style={{ fontSize: 14, color: C.textTertiary }}>Loading...</div></div>;
    const client = data.clients.find(c => c.shareToken === shareView);
    if (!client) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{css}</style><div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 8 }}>Link not found</div><div style={{ fontSize: 14, color: C.textTertiary }}>This share link may have expired.</div></div></div>;
    return <ClientShareView client={client} data={data} onSave={save} />;
  }

  if (!loaded) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{css}</style><div style={{ fontSize: 14, color: C.textTertiary }}>Loading...</div></div>;

  // ═══ ADMIN VIEW ═══
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{css}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(20px) saturate(180%)", borderBottom: `1px solid ${C.border}`, padding: "0 28px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>Peak Planner</span>
            {saving && <span style={{ fontSize: 12, color: C.accent, animation: "pulse 1s infinite" }}>Saving</span>}
            {loading && <span style={{ fontSize: 12, color: C.accent, animation: "pulse 1s infinite" }}>Working...</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {view === "calendar" && selectedClient && (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setView("clients"); setSelectedClient(null); }}>Back</Button>
                <Button variant="secondary" size="sm" onClick={() => setShareModal(selectedClient)}>Share</Button>
                <Button variant="secondary" size="sm" onClick={() => generatePlans(selectedClient, data)} disabled={loading}>Regenerate Plans</Button>
                <Button variant="primary" size="sm" onClick={() => setShowAddEvent(true)}>Add Event</Button>
              </>
            )}
            {view === "clients" && <Button variant="primary" size="sm" onClick={() => setShowNewClient(true)}>New Client</Button>}
          </div>
        </div>
      </nav>

      {error && (
        <div style={{ background: C.red + "10", borderBottom: `1px solid ${C.red}25`, padding: "12px 28px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: C.red }}>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 28px" }}>

        {/* ═══ CLIENTS LIST ═══ */}
        {view === "clients" && (
          <div className="fade-in">
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 24 }}>Clients</h1>
            {data.clients.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>No clients yet</div>
                <div style={{ fontSize: 14, color: C.textTertiary, marginBottom: 24 }}>Add your first client to start planning peaks.</div>
                <Button variant="primary" size="lg" onClick={() => setShowNewClient(true)}>New Client</Button>
              </div>
            ) : data.clients.map(cl => {
              const eventCount = (cl.events || []).length;
              const planCount = Object.keys(cl.plans || {}).length;
              const customCount = (cl.events || []).filter(e => e.type === "custom").length;
              const clientSubmitted = (cl.events || []).filter(e => e.submittedBy === "client").length;
              return (
                <div key={cl.id} onClick={() => { setSelectedClient(cl); setView("calendar"); }}
                  style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 8, padding: "20px 24px", cursor: "pointer", transition: "border-color 0.15s, transform 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 4 }}>{cl.name}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: C.textTertiary }}>{cl.niche}</span>
                        <span style={{ fontSize: 12, color: C.textTertiary }}>{eventCount} events</span>
                        <span style={{ fontSize: 12, color: C.textTertiary }}>{planCount} plans</span>
                        {customCount > 0 && <span style={{ fontSize: 12, color: C.pink }}>{customCount} custom</span>}
                        {clientSubmitted > 0 && <span style={{ fontSize: 12, color: C.orange }}>{clientSubmitted} client-submitted</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteClient(cl.id); }}>Delete</Button>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ CLIENT CALENDAR ═══ */}
        {view === "calendar" && selectedClient && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>{selectedClient.name}</h1>
                <p style={{ fontSize: 14, color: C.textSecondary }}>
                  {(selectedClient.events || []).length} events · {Object.keys(selectedClient.plans || {}).length} plans · {selectedClient.niche}
                </p>
              </div>
            </div>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 20, background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ width: 20, height: 20, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: 10, animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 14, color: C.textSecondary }}>{loadingMsg}</span>
              </div>
            )}

            <CalendarView client={selectedClient} />
          </div>
        )}
      </div>

      {/* ═══ NEW CLIENT MODAL ═══ */}
      {showNewClient && (
        <Modal title="New Client" onClose={() => setShowNewClient(false)}>
          <Input label="Brand Name" value={brandName} onChange={setBrandName} placeholder="Glow Skin Co" />

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 6 }}>Niche</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {NICHES.map(n => <Pill key={n} color={C.purple} active={niche === n} onClick={() => setNiche(n)}>{n}</Pill>)}
            </div>
            {niche === "Other" && <div style={{ marginTop: 8 }}><Input value={customNiche} onChange={setCustomNiche} placeholder="Your niche..." /></div>}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 6 }}>Markets</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {REGIONS.map(r => <Pill key={r} color={C.teal} active={selectedRegions.includes(r)} onClick={() => toggleRegion(r)}>{r}</Pill>)}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Input label="Monthly Budget" value={monthlyBudget} onChange={setMonthlyBudget} placeholder="$15,000" />
            <div />
          </div>
          <Input label="Key Products" value={products} onChange={setProducts} placeholder="Dark spot corrector, vitamin C serum..." textarea rows={2} />

          <Button variant="primary" fullWidth onClick={createClient} disabled={!brandName.trim() || !effectiveNiche || loading}>
            {loading ? "Creating..." : "Create & Generate Calendar"}
          </Button>
        </Modal>
      )}

      {/* ═══ ADD EVENT MODAL ═══ */}
      {showAddEvent && (
        <Modal title="Add Custom Event" onClose={() => setShowAddEvent(false)}>
          <Input label="Event Name" value={evtName} onChange={setEvtName} placeholder="Summer Launch, Flash Sale, Anniversary..." />
          <Input label="Event Date" value={evtDate} onChange={setEvtDate} type="date" />
          <p style={{ fontSize: 12, color: C.textTertiary, marginBottom: 14 }}>Claude will generate a full phased campaign plan.</p>
          <Button variant="primary" fullWidth onClick={addCustomEvent} disabled={!evtName.trim() || !evtDate || loading}>
            {loading ? "Generating..." : "Add & Generate Plan"}
          </Button>
        </Modal>
      )}

      {/* ═══ SHARE MODAL ═══ */}
      {shareModal && (
        <Modal title="Share with Client" onClose={() => { setShareModal(null); setCopied(false); }}>
          <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 16, lineHeight: 1.5 }}>
            Send this link to <strong style={{ color: C.text }}>{shareModal.name}</strong>. They can view their calendar and suggest events.
          </p>
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: C.accent, wordBreak: "break-all", marginBottom: 16 }}>
            {getShareUrl(shareModal)}
          </div>
          <Button variant="primary" fullWidth onClick={() => copyShareLink(shareModal)}>
            {copied ? "Copied" : "Copy Link"}
          </Button>
        </Modal>
      )}

      <footer style={{ padding: "24px 28px", textAlign: "center", marginTop: 40 }}>
        <p style={{ fontSize: 12, color: C.textTertiary }}>Peak Planner · Claude-Powered · D-DOUBLEU MEDIA</p>
      </footer>
    </div>
  );
}

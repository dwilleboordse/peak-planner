import { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════
// DESIGN
// ═══════════════════════════════════════════

const C = {
  bg:"#000",surface:"#0d0d0d",surface2:"#161616",surface3:"#1c1c1e",
  card:"#1c1c1e",border:"rgba(255,255,255,0.08)",borderLight:"rgba(255,255,255,0.12)",
  text:"#f5f5f7",textSecondary:"#86868b",textTertiary:"#48484a",
  accent:"#0a84ff",green:"#30d158",red:"#ff453a",orange:"#ff9f0a",
  purple:"#bf5af2",teal:"#64d2ff",yellow:"#ffd60a",pink:"#ff375f",
};
const TYPE_COLORS={global:C.accent,regional:C.purple,industry:C.teal,custom:C.pink};
const PHASE_COLORS={teaser:C.purple,launch:C.green,peak:C.orange,last_call:C.red,post:C.teal};
const PHASE_LABELS={teaser:"Teaser",launch:"Launch",peak:"Peak",last_call:"Last Call",post:"Post-Event"};
const PHASE_KEYS=["teaser","launch","peak","last_call","post"];
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_OF_WEEK=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const css=`
*{margin:0;padding:0;box-sizing:border-box}
body{background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased}
::selection{background:${C.accent}40}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.textTertiary};border-radius:3px}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes spin{to{transform:rotate(360deg)}}
.fade-in{animation:fadeIn 0.4s ease-out forwards}
`;

const BASE_EVENTS=[
  {id:"nye",name:"New Year's Day",date:"01-01",type:"global",regions:["Global"]},
  {id:"cny",name:"Chinese New Year",date:"01-29",type:"regional",regions:["APAC","Global"]},
  {id:"valentines",name:"Valentine's Day",date:"02-14",type:"global",regions:["Global"]},
  {id:"intl-womens",name:"International Women's Day",date:"03-08",type:"global",regions:["Global"]},
  {id:"st-patrick",name:"St. Patrick's Day",date:"03-17",type:"regional",regions:["US","EU","UK"]},
  {id:"easter",name:"Easter",date:"04-20",type:"global",regions:["Global"]},
  {id:"kingsday",name:"King's Day (NL)",date:"04-27",type:"regional",regions:["NL","EU"]},
  {id:"mothers-day",name:"Mother's Day",date:"05-11",type:"global",regions:["US","EU","Global"]},
  {id:"memorial-day",name:"Memorial Day (US)",date:"05-26",type:"regional",regions:["US"]},
  {id:"fathers-day",name:"Father's Day",date:"06-15",type:"global",regions:["US","EU","Global"]},
  {id:"july4",name:"4th of July",date:"07-04",type:"regional",regions:["US"]},
  {id:"prime-day",name:"Amazon Prime Day",date:"07-15",type:"industry",regions:["Global"]},
  {id:"back-school",name:"Back to School",date:"08-15",type:"industry",regions:["US","EU","Global"]},
  {id:"labor-day",name:"Labor Day (US)",date:"09-01",type:"regional",regions:["US"]},
  {id:"singles-day",name:"Singles' Day (11.11)",date:"11-11",type:"global",regions:["APAC","Global"]},
  {id:"bfcm",name:"Black Friday / Cyber Monday",date:"11-28",type:"global",regions:["Global"]},
  {id:"giving-tues",name:"Giving Tuesday",date:"12-02",type:"global",regions:["US","Global"]},
  {id:"christmas",name:"Christmas",date:"12-25",type:"global",regions:["Global"]},
  {id:"boxing-day",name:"Boxing Day",date:"12-26",type:"regional",regions:["UK","AU","EU"]},
  {id:"nye-eve",name:"New Year's Eve",date:"12-31",type:"global",regions:["Global"]},
];
const NICHES=["Skincare / Beauty","Health & Supplements","Fitness / Activewear","Fashion / Apparel","Home & Kitchen","Pet Products","Food & Beverage","Baby & Kids","Electronics / Gadgets","Jewelry & Accessories","Outdoor / Sports","Other"];
const REGIONS=["Global","US","EU","UK","NL","APAC","AU","LATAM","Middle East"];
const YEARS=[2026,2027,2028,2029,2030];

const genId=()=>Math.random().toString(36).substring(2,10);
const genToken=()=>Math.random().toString(36).substring(2,14);
const sortEvents=(a,b)=>{const am=parseInt(a.date.split("-")[0]),bm=parseInt(b.date.split("-")[0]),ad=parseInt(a.date.split("-")[1]),bd=parseInt(b.date.split("-")[1]);return am!==bm?am-bm:ad-bd;};

const SYS=`You are an elite eCommerce growth strategist. Generate campaign plans for calendar events.
Respond ONLY in valid JSON:
{"niche_events":[{"id":"unique","name":"Event","date":"MM-DD","type":"industry","regions":["regions"],"why":"relevance"}],
"plans":[{"event_id":"id","relevance":"high/medium/low","relevance_reason":"why","summary":"strategy","budget_pct":"30%",
"phases":{"teaser":{"days_before":14,"description":"what","ad_angles":["angle"],"hooks":["hook"],"email_sms":"strategy"},
"launch":{"days_before":0,"description":"launch","ad_angles":["angle"],"hooks":["hook"],"email_sms":"strategy"},
"peak":{"days_after":1,"duration_days":2,"description":"peak","ad_angles":["angle"],"hooks":["hook"],"email_sms":"strategy"},
"last_call":{"days_before_end":1,"description":"urgency","ad_angles":["angle"],"hooks":["hook"],"email_sms":"strategy"},
"post":{"days_after_end":1,"duration_days":5,"description":"follow up","ad_angles":["angle"],"hooks":["hook"],"email_sms":"strategy"}},
"offer_suggestions":["offer"],"creative_formats":["format"]}]}
Generate 3-6 niche-specific events. Plans for ALL events. Niche-specific. Ready-to-use hooks. Realistic timelines.`;

// ═══════════════════════════════════════════
// API
// ═══════════════════════════════════════════

async function loadData(){try{const r=await fetch("/api/data");if(!r.ok)throw new Error();return await r.json();}catch(e){return{clients:[]};}}
async function saveData(d){try{await fetch("/api/data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});}catch(e){console.error(e);}}

function safeParseJSON(raw) {
  let text = (raw || "").replace(/```json|```/g, "").trim();
  if (!text) throw new Error("Empty response.");
  if (!text.endsWith("}")) {
    const lc = Math.max(text.lastIndexOf("}]"), text.lastIndexOf("}"));
    if (lc > 0) { text = text.substring(0, lc + 1); if (!text.endsWith("]}")) text += "]}"; if (!text.endsWith("}")) text += "}"; }
  }
  try { return JSON.parse(text); } catch(e) {
    let f = text;
    const ob=(f.match(/{/g)||[]).length,cb=(f.match(/}/g)||[]).length;
    for(let i=0;i<ob-cb;i++) f+="}";
    const oq=(f.match(/\[/g)||[]).length,cq=(f.match(/\]/g)||[]).length;
    for(let i=0;i<oq-cq;i++) f+="]";
    if(!f.endsWith("}")) f+="}";
    return JSON.parse(f);
  }
}

// ═══════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════

function Button({children,onClick,variant="secondary",size="md",disabled,fullWidth}){
  const v={primary:{bg:C.accent,c:"#fff",b:"none"},secondary:{bg:C.surface3,c:C.text,b:`1px solid ${C.border}`},ghost:{bg:"transparent",c:C.textSecondary,b:"none"},danger:{bg:C.red+"18",c:C.red,b:`1px solid ${C.red}30`}};
  const s={sm:{p:"6px 14px",f:12},md:{p:"10px 20px",f:14},lg:{p:"14px 28px",f:15}};
  const vv=v[variant]||v.secondary,ss=s[size]||s.md;
  return <button onClick={onClick} disabled={disabled} style={{padding:ss.p,fontSize:ss.f,fontFamily:"inherit",fontWeight:500,borderRadius:10,cursor:disabled?"default":"pointer",opacity:disabled?0.35:1,transition:"all 0.2s",width:fullWidth?"100%":"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,background:vv.bg,color:vv.c,border:vv.b,letterSpacing:"-0.01em"}}>{children}</button>;
}

function Input({label,value,onChange,placeholder,type="text",textarea,rows=3,hint}){
  const sh={width:"100%",fontFamily:"inherit",fontSize:14,color:C.text,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",outline:"none",transition:"border-color 0.2s"};
  return <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:12,fontWeight:500,color:C.textSecondary,marginBottom:hint?2:6}}>{label}</label>}
    {hint&&<div style={{fontSize:11,color:C.textTertiary,marginBottom:6}}>{hint}</div>}
    {textarea?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...sh,resize:"vertical",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
    :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={sh} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>}
  </div>;
}

function Pill({children,color,onClick,active}){
  return <button onClick={onClick} style={{fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:16,cursor:onClick?"pointer":"default",transition:"all 0.15s",fontFamily:"inherit",background:(active!==undefined?active:true)?(color||C.accent)+"15":"transparent",color:(active!==undefined?active:true)?(color||C.accent):C.textTertiary,border:`1px solid ${(active!==undefined?active:true)?(color||C.accent)+"40":C.border}`,whiteSpace:"nowrap"}}>{children}</button>;
}

function Modal({children,onClose,title,wide}){
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
    <div onClick={e=>e.stopPropagation()} className="fade-in" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,width:"100%",maxWidth:wide?720:520,maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.surface,zIndex:10,borderRadius:"20px 20px 0 0"}}>
        <div style={{fontSize:17,fontWeight:600,letterSpacing:"-0.02em"}}>{title}</div>
        <button onClick={onClose} style={{width:28,height:28,borderRadius:14,background:C.surface3,border:"none",color:C.textSecondary,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{padding:24}}>{children}</div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════
// EVENT DETAIL MODAL (view + edit plan)
// ═══════════════════════════════════════════

function EventDetailModal({ event, plan, onClose, onSavePlan, onDeletePlan, onGeneratePlan, loading }) {
  const tc = TYPE_COLORS[event.type] || C.accent;
  const mi = parseInt(event.date.split("-")[0]) - 1;
  const day = parseInt(event.date.split("-")[1]);

  // Editable plan state
  const [editMode, setEditMode] = useState(false);
  const [summary, setSummary] = useState(plan?.summary || "");
  const [budgetPct, setBudgetPct] = useState(plan?.budget_pct || "");
  const [offers, setOffers] = useState((plan?.offer_suggestions || []).join("\n"));
  const [formats, setFormats] = useState((plan?.creative_formats || []).join(", "));
  const [phases, setPhases] = useState(() => {
    const p = {};
    PHASE_KEYS.forEach(k => {
      const src = plan?.phases?.[k] || {};
      p[k] = {
        description: src.description || "",
        ad_angles: (src.ad_angles || []).join("\n"),
        hooks: (src.hooks || []).join("\n"),
        email_sms: src.email_sms || "",
      };
    });
    return p;
  });

  const updatePhase = (key, field, val) => {
    setPhases(p => ({ ...p, [key]: { ...p[key], [field]: val } }));
  };

  const handleSave = () => {
    const builtPhases = {};
    PHASE_KEYS.forEach(k => {
      builtPhases[k] = {
        ...(plan?.phases?.[k] || {}),
        description: phases[k].description,
        ad_angles: phases[k].ad_angles.split("\n").map(s => s.trim()).filter(Boolean),
        hooks: phases[k].hooks.split("\n").map(s => s.trim()).filter(Boolean),
        email_sms: phases[k].email_sms,
      };
    });
    const newPlan = {
      ...(plan || {}),
      event_id: event.id,
      summary,
      budget_pct: budgetPct,
      offer_suggestions: offers.split("\n").map(s => s.trim()).filter(Boolean),
      creative_formats: formats.split(",").map(s => s.trim()).filter(Boolean),
      phases: builtPhases,
      relevance: plan?.relevance || "medium",
      relevance_reason: plan?.relevance_reason || "",
    };
    onSavePlan(event.id, newPlan);
    setEditMode(false);
  };

  return (
    <Modal title={event.name} onClose={onClose} wide>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ textAlign: "center", minWidth: 50 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textTertiary }}>{MONTHS[mi]}</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>{day}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill color={tc}>{event.type}</Pill>
            {event.regions?.map((r, i) => <span key={i} style={{ fontSize: 11, color: C.textTertiary }}>{r}</span>)}
            {event.submittedBy && <Pill color={C.pink}>Client submitted</Pill>}
            {plan?.relevance && <Pill color={plan.relevance === "high" ? C.green : plan.relevance === "medium" ? C.orange : C.textTertiary}>{plan.relevance} relevance</Pill>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Button variant="primary" size="sm" onClick={() => setEditMode(!editMode)}>
          {editMode ? "Cancel Edit" : (plan ? "Edit Plan" : "Add Plan Manually")}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onGeneratePlan(event)} disabled={loading}>
          {loading ? "Generating..." : (plan ? "Regenerate with AI" : "Generate with AI")}
        </Button>
        {plan && onDeletePlan && (
          <Button variant="danger" size="sm" onClick={() => { if (confirm("Delete this plan?")) { onDeletePlan(event.id); onClose(); } }}>
            Delete Plan
          </Button>
        )}
      </div>

      {/* EDIT MODE */}
      {editMode && (
        <div style={{ background: C.surface2, borderRadius: 14, padding: 18, marginBottom: 20, border: `1px solid ${C.accent}30` }}>
          <Input label="Campaign Summary" value={summary} onChange={setSummary} placeholder="Overall strategy for this event..." textarea rows={2} />
          <Input label="Budget Allocation" value={budgetPct} onChange={setBudgetPct} placeholder="e.g. 25%" />
          <Input label="Offer Ideas (one per line)" value={offers} onChange={setOffers} placeholder="Buy 2 get 1 free\nFree shipping over $50" textarea rows={2} />
          <Input label="Creative Formats (comma separated)" value={formats} onChange={setFormats} placeholder="UGC, Brand Story, Product Demo" />

          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, marginTop: 12, marginBottom: 10 }}>Campaign Phases</div>
          {PHASE_KEYS.map(k => (
            <div key={k} style={{ background: C.surface3, borderRadius: 10, padding: 14, marginBottom: 8, borderLeft: `3px solid ${PHASE_COLORS[k]}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PHASE_COLORS[k], marginBottom: 8 }}>{PHASE_LABELS[k]}</div>
              <Input label="Strategy" value={phases[k].description} onChange={v => updatePhase(k, "description", v)} placeholder="What to do in this phase..." textarea rows={2} />
              <Input label="Ad Angles (one per line)" value={phases[k].ad_angles} onChange={v => updatePhase(k, "ad_angles", v)} placeholder="Angle 1\nAngle 2" textarea rows={2} />
              <Input label="Hooks (one per line)" value={phases[k].hooks} onChange={v => updatePhase(k, "hooks", v)} placeholder="Hook line 1\nHook line 2" textarea rows={2} />
              <Input label="Email / SMS" value={phases[k].email_sms} onChange={v => updatePhase(k, "email_sms", v)} placeholder="Email/SMS strategy..." />
            </div>
          ))}
          <Button variant="primary" fullWidth onClick={handleSave}>Save Plan</Button>
        </div>
      )}

      {/* VIEW MODE — show plan */}
      {!editMode && plan && (
        <div>
          {plan.summary && <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>{plan.summary}</div>}
          {plan.relevance_reason && <div style={{ fontSize: 12, color: C.textTertiary, fontStyle: "italic", marginBottom: 14 }}>{plan.relevance_reason}</div>}

          <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            {plan.budget_pct && <div><div style={{ fontSize: 10, fontWeight: 600, color: C.textTertiary }}>BUDGET</div><div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>{plan.budget_pct}</div></div>}
            {plan.offer_suggestions?.length > 0 && <div style={{ flex: 1, minWidth: 200 }}><div style={{ fontSize: 10, fontWeight: 600, color: C.textTertiary, marginBottom: 4 }}>OFFERS</div>{plan.offer_suggestions.map((o, i) => <div key={i} style={{ fontSize: 12, color: C.textSecondary }}>- {o}</div>)}</div>}
            {plan.creative_formats?.length > 0 && <div><div style={{ fontSize: 10, fontWeight: 600, color: C.textTertiary, marginBottom: 4 }}>FORMATS</div><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{plan.creative_formats.map((f, i) => <Pill key={i} color={C.teal}>{f}</Pill>)}</div></div>}
          </div>

          {PHASE_KEYS.map(pk => {
            const pd = plan.phases?.[pk]; if (!pd || !pd.description) return null;
            const color = PHASE_COLORS[pk];
            return <div key={pk} style={{ background: C.surface2, borderRadius: 12, padding: 14, marginBottom: 8, borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6 }}>{PHASE_LABELS[pk]}</div>
              <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginBottom: 6 }}>{pd.description}</div>
              {pd.ad_angles?.length > 0 && <div style={{ marginBottom: 4 }}><span style={{ fontSize: 10, fontWeight: 600, color: C.textTertiary }}>ANGLES: </span>{pd.ad_angles.map((a, i) => <span key={i} style={{ fontSize: 12, color: C.textSecondary }}>{i > 0 ? " · " : ""}{a}</span>)}</div>}
              {pd.hooks?.length > 0 && <div style={{ marginBottom: 4 }}>{pd.hooks.map((h, i) => <div key={i} style={{ fontSize: 12, color: C.text, fontStyle: "italic" }}>"{h}"</div>)}</div>}
              {pd.email_sms && <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 4 }}>{pd.email_sms}</div>}
            </div>;
          })}
        </div>
      )}

      {!editMode && !plan && (
        <div style={{ textAlign: "center", padding: 32, color: C.textTertiary }}>
          No plan yet. Add one manually or generate with AI.
        </div>
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════
// CALENDAR GRID VIEW
// ═══════════════════════════════════════════

function CalendarGrid({ events, plans, year, onClickEvent }) {
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfWeek = (y, m) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }; // Mon=0

  const daysInMonth = getDaysInMonth(year, viewMonth);
  const firstDay = getFirstDayOfWeek(year, viewMonth);
  const cells = [];

  // Blank cells before month start
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, events: [] });

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const dayStr = mm + "-" + dd;
    const dayEvents = events.filter(e => e.date === dayStr);
    cells.push({ day: d, events: dayEvents });
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === viewMonth;

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Button variant="ghost" size="sm" onClick={() => setViewMonth(p => p > 0 ? p - 1 : 11)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textSecondary} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </Button>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>{FULL_MONTHS[viewMonth]} {year}</div>
        <Button variant="ghost" size="sm" onClick={() => setViewMonth(p => p < 11 ? p + 1 : 0)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textSecondary} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </Button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAYS_OF_WEEK.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: C.textTertiary, padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((cell, i) => {
          const isToday = isCurrentMonth && cell.day === today.getDate();
          const hasEvents = cell.events.length > 0;
          return (
            <div key={i} style={{
              minHeight: 80, padding: 6, borderRadius: 10,
              background: cell.day ? (isToday ? C.accent + "10" : C.surface2) : "transparent",
              border: `1px solid ${isToday ? C.accent + "40" : cell.day ? C.border : "transparent"}`,
              cursor: hasEvents ? "pointer" : "default",
              transition: "background 0.15s",
            }}
              onClick={() => { if (cell.events.length === 1) onClickEvent(cell.events[0]); }}
            >
              {cell.day && (
                <>
                  <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? C.accent : C.textSecondary, marginBottom: 4 }}>{cell.day}</div>
                  {cell.events.map((evt, ei) => {
                    const tc = TYPE_COLORS[evt.type] || C.accent;
                    const hasPlan = !!plans[evt.id];
                    return (
                      <div key={ei} onClick={(e) => { e.stopPropagation(); onClickEvent(evt); }}
                        style={{
                          fontSize: 10, fontWeight: 600, color: tc, background: tc + "15",
                          padding: "2px 6px", borderRadius: 6, marginBottom: 2,
                          cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          borderLeft: `2px solid ${hasPlan ? C.green : C.textTertiary}`,
                        }}>
                        {evt.name}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: C.green }} /><span style={{ fontSize: 10, color: C.textTertiary }}>Has plan</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: C.textTertiary }} /><span style={{ fontSize: 10, color: C.textTertiary }}>No plan</span></div>
        {Object.entries(TYPE_COLORS).map(([k, c]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: c }} /><span style={{ fontSize: 10, color: C.textTertiary }}>{k}</span></div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════════

function ListView({ events, plans, onClickEvent }) {
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const filtered = events.filter(e => {
    if (filterMonth !== "all" && parseInt(e.date.split("-")[0]) !== parseInt(filterMonth)) return false;
    if (filterType !== "all" && e.type !== filterType) return false;
    return true;
  });

  const monthCounts = {};
  events.forEach(e => { const m = parseInt(e.date.split("-")[0]); monthCounts[m] = (monthCounts[m] || 0) + 1; });
  const maxC = Math.max(...Object.values(monthCounts), 1);

  const byMonth = {};
  filtered.forEach(e => { const m = parseInt(e.date.split("-")[0]); if (!byMonth[m]) byMonth[m] = []; byMonth[m].push(e); });

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {MONTHS.map((m, i) => {
          const count = monthCounts[i + 1] || 0;
          return <button key={m} onClick={() => setFilterMonth(filterMonth === String(i + 1) ? "all" : String(i + 1))} style={{
            flex: 1, padding: "6px 0", borderRadius: 8, border: `1px solid ${parseInt(filterMonth) === i + 1 ? C.accent + "40" : C.border}`,
            cursor: "pointer", fontFamily: "inherit", background: parseInt(filterMonth) === i + 1 ? C.accent + "20" : C.surface2,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.textSecondary }}>{m}</div>
            {count > 0 && <div style={{ height: 3, borderRadius: 2, margin: "3px 4px 0", background: C.accent, transform: `scaleX(${Math.max(count / maxC, 0.15)})`, transformOrigin: "left" }} />}
          </button>;
        })}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <Pill active={filterType === "all"} onClick={() => setFilterType("all")}>All ({events.length})</Pill>
        {["global","regional","industry","custom"].map(t => {
          const n = events.filter(e => e.type === t).length;
          return n > 0 ? <Pill key={t} active={filterType === t} onClick={() => setFilterType(filterType === t ? "all" : t)} color={TYPE_COLORS[t]}>{t} ({n})</Pill> : null;
        })}
      </div>

      {Object.keys(byMonth).sort((a, b) => a - b).map(m => (
        <div key={m} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{FULL_MONTHS[parseInt(m) - 1]}</div>
          {byMonth[m].map(e => {
            const tc = TYPE_COLORS[e.type] || C.accent;
            const plan = plans[e.id];
            const rc = plan?.relevance === "high" ? C.green : plan?.relevance === "medium" ? C.orange : C.textTertiary;
            const mi2 = parseInt(e.date.split("-")[0]) - 1;
            const day = parseInt(e.date.split("-")[1]);
            return <div key={e.id} onClick={() => onClickEvent(e)} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 6, padding: "14px 18px", cursor: "pointer", transition: "border-color 0.15s, transform 0.1s" }}
              onMouseEnter={ev => { ev.currentTarget.style.borderColor = C.borderLight; ev.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={ev => { ev.currentTarget.style.borderColor = C.border; ev.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "center", minWidth: 36 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.textTertiary }}>{MONTHS[mi2]}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em" }}>{day}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em" }}>{e.name}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                      <Pill color={tc}>{e.type}</Pill>
                      {e.submittedBy && <Pill color={C.pink}>Client</Pill>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {plan ? <span style={{ fontSize: 12, fontWeight: 600, color: rc }}>{plan.relevance}</span> : <span style={{ fontSize: 11, color: C.textTertiary }}>No plan</span>}
                  {plan?.budget_pct && <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>{plan.budget_pct}</span>}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            </div>;
          })}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// CLIENT SHARE VIEW
// ═══════════════════════════════════════════

function ClientShareView({ client, data, onSave }) {
  const [showAdd, setShowAdd] = useState(false);
  const [evtName, setEvtName] = useState("");
  const [evtDate, setEvtDate] = useState("");
  const [evtNote, setEvtNote] = useState("");
  const [detail, setDetail] = useState(null);

  const submitEvent = () => {
    if (!evtName.trim() || !evtDate) return;
    const parts = evtDate.split("-");
    const mmdd = parts[1] + "-" + parts[2];
    const ne = { id: "client-" + genId(), name: evtName.trim(), date: mmdd, type: "custom", regions: client.regions || ["Global"], submittedBy: "client", note: evtNote };
    const uc = { ...client, events: [...(client.events || []), ne].sort(sortEvents) };
    onSave({ ...data, clients: data.clients.map(c => c.id === client.id ? uc : c) });
    setShowAdd(false); setEvtName(""); setEvtDate(""); setEvtNote("");
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{css}</style>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(20px) saturate(180%)", borderBottom: `1px solid ${C.border}`, padding: "0 28px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Peak Planner</span>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>Suggest Event</Button>
        </div>
      </nav>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 28px" }} className="fade-in">
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>{client.name}</h1>
        <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 24 }}>{(client.events || []).length} events · {client.niche}</p>
        <ListView events={client.events || []} plans={client.plans || {}} onClickEvent={e => setDetail(e)} />
      </div>
      <footer style={{ padding: "24px 28px", textAlign: "center", marginTop: 40 }}><p style={{ fontSize: 12, color: C.textTertiary }}>Managed by D-DOUBLEU MEDIA</p></footer>

      {detail && <EventDetailModal event={detail} plan={(client.plans || {})[detail.id]} onClose={() => setDetail(null)} onSavePlan={() => {}} onGeneratePlan={() => {}} loading={false} />}

      {showAdd && <Modal title="Suggest an Event" onClose={() => setShowAdd(false)}>
        <Input label="Event Name" value={evtName} onChange={setEvtName} placeholder="Summer Launch, Flash Sale..." />
        <Input label="Event Date" value={evtDate} onChange={setEvtDate} type="date" />
        <Input label="Notes" value={evtNote} onChange={setEvtNote} placeholder="Details..." textarea rows={2} />
        <Button variant="primary" fullWidth onClick={submitEvent} disabled={!evtName.trim() || !evtDate}>Submit</Button>
      </Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════

export default function App() {
  const [data, setData] = useState({ clients: [] });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("clients");
  const [selectedClient, setSelectedClient] = useState(null);
  const [shareView, setShareView] = useState(null);
  const [calView, setCalView] = useState("list"); // list | calendar
  const [selectedYear, setSelectedYear] = useState(2026);

  const [showNewClient, setShowNewClient] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [selectedRegions, setSelectedRegions] = useState(["Global"]);
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [products, setProducts] = useState("");

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [evtName, setEvtName] = useState("");
  const [evtDate, setEvtDate] = useState("");
  const [shareModal, setShareModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#share/")) setShareView(hash.replace("#share/", ""));
    const onHash = () => { const h = window.location.hash; if (h.startsWith("#share/")) setShareView(h.replace("#share/", "")); else setShareView(null); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => { loadData().then(d => { setData(d); setLoaded(true); }); }, []);
  useEffect(() => { if (!shareView) return; const i = setInterval(() => { loadData().then(d => setData(d)); }, 30000); return () => clearInterval(i); }, [shareView]);

  const save = useCallback(async (nd) => { setData(nd); setSaving(true); await saveData(nd); setSaving(false); }, []);
  const effectiveNiche = niche === "Other" ? customNiche : niche;
  const toggleRegion = (r) => setSelectedRegions(p => p.includes(r) ? (p.length > 1 ? p.filter(x => x !== r) : p) : [...p, r]);

  const updateClient = (updatedClient) => {
    const nd = { ...data, clients: data.clients.map(c => c.id === updatedClient.id ? updatedClient : c) };
    save(nd);
    setSelectedClient(updatedClient);
  };

  const createClient = () => {
    if (!brandName.trim() || !effectiveNiche) return;
    const be = BASE_EVENTS.filter(e => e.regions.some(r => selectedRegions.includes(r) || selectedRegions.includes("Global") || r === "Global")).map(e => ({ ...e }));
    const nc = { id: genId(), name: brandName.trim(), niche: effectiveNiche, regions: selectedRegions, budget: monthlyBudget, products, shareToken: genToken(), createdAt: new Date().toISOString(), events: be.sort(sortEvents), plans: {} };
    const nd = { ...data, clients: [...data.clients, nc] };
    save(nd);
    setSelectedClient(nc); setView("calendar"); setShowNewClient(false);
    setBrandName(""); setNiche(""); setCustomNiche(""); setSelectedRegions(["Global"]); setMonthlyBudget(""); setProducts("");
    generatePlans(nc, nd);
  };

  const deleteClient = (id) => {
    if (!confirm("Delete?")) return;
    save({ ...data, clients: data.clients.filter(c => c.id !== id) });
    if (selectedClient?.id === id) { setSelectedClient(null); setView("clients"); }
  };

  const generatePlans = async (client, currentData) => {
    setLoading(true); setLoadingMsg("Generating campaign plans (30-60s)...");
    try {
      const el = (client.events || []).map(e => `- ${e.id}: ${e.name} (${e.date}, ${e.type})`).join("\n");
      const res = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 16000, system: SYS,
          messages: [{ role: "user", content: `BRAND: ${client.name}\nNiche: ${client.niche}\nMarkets: ${(client.regions||[]).join(", ")}\nBudget: ${client.budget || "N/A"}\nProducts: ${client.products || "N/A"}\n\nEVENTS:\n${el}\n\nGenerate niche events + plans for ALL.` }] }) });
      const d = await res.json();
      if (d.error) throw new Error(typeof d.error === "string" ? d.error : d.error.message);
      const parsed = safeParseJSON(d.content?.[0]?.text);
      const ne = (parsed.niche_events || []).map(e => ({ ...e, id: e.id || "niche-" + genId() }));
      const allE = [...(client.events || []), ...ne].sort(sortEvents);
      const pm = { ...(client.plans || {}) };
      (parsed.plans || []).forEach(p => { pm[p.event_id] = p; });
      const uc = { ...client, events: allE, plans: pm };
      const nd = { ...(currentData || data), clients: (currentData || data).clients.map(c => c.id === client.id ? uc : c) };
      save(nd); setSelectedClient(uc);
    } catch (e) { setError(e.message); }
    setLoading(false); setLoadingMsg("");
  };

  const generateSinglePlan = async (event) => {
    if (!selectedClient) return;
    setLoading(true); setLoadingMsg(`Planning "${event.name}"...`);
    try {
      const res = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, system: SYS,
          messages: [{ role: "user", content: `BRAND: ${selectedClient.name}\nNiche: ${selectedClient.niche}\nMarkets: ${(selectedClient.regions||[]).join(", ")}\nBudget: ${selectedClient.budget||"N/A"}\nProducts: ${selectedClient.products||"N/A"}\n\nGenerate plan for ONE event:\n- ${event.id}: ${event.name} (${event.date}, ${event.type})\n\nReturn JSON with "niche_events":[] and "plans":[single plan].` }] }) });
      const d = await res.json();
      if (!d.error) {
        const parsed = safeParseJSON(d.content?.[0]?.text);
        if (parsed.plans?.[0]) {
          const np = { ...selectedClient.plans, [parsed.plans[0].event_id || event.id]: parsed.plans[0] };
          const uc = { ...selectedClient, plans: np };
          updateClient(uc);
          setDetailEvent(prev => prev?.id === event.id ? { ...prev } : prev); // force rerender
        }
      }
    } catch (e) { setError(e.message); }
    setLoading(false); setLoadingMsg("");
  };

  const savePlanForEvent = (eventId, plan) => {
    const np = { ...selectedClient.plans, [eventId]: plan };
    updateClient({ ...selectedClient, plans: np });
  };

  const deletePlanForEvent = (eventId) => {
    const np = { ...selectedClient.plans };
    delete np[eventId];
    updateClient({ ...selectedClient, plans: np });
  };

  const addCustomEvent = () => {
    if (!evtName.trim() || !evtDate || !selectedClient) return;
    const parts = evtDate.split("-");
    const mmdd = parts[1] + "-" + parts[2];
    const ne = { id: "custom-" + genId(), name: evtName.trim(), date: mmdd, type: "custom", regions: selectedClient.regions || ["Global"] };
    const uc = { ...selectedClient, events: [...(selectedClient.events || []), ne].sort(sortEvents) };
    updateClient(uc);
    setShowAddEvent(false); setEvtName(""); setEvtDate("");
    setDetailEvent(ne); // open it immediately
  };

  const getShareUrl = (c) => `${window.location.origin}${window.location.pathname}#share/${c.shareToken}`;
  const copyShareLink = (c) => { navigator.clipboard.writeText(getShareUrl(c)); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // SHARE VIEW
  if (shareView) {
    if (!loaded) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{css}</style><div style={{ fontSize: 14, color: C.textTertiary }}>Loading...</div></div>;
    const cl = data.clients.find(c => c.shareToken === shareView);
    if (!cl) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{css}</style><div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Link not found</div></div></div>;
    return <ClientShareView client={cl} data={data} onSave={save} />;
  }
  if (!loaded) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{css}</style><div style={{ fontSize: 14, color: C.textTertiary }}>Loading...</div></div>;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{css}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(20px) saturate(180%)", borderBottom: `1px solid ${C.border}`, padding: "0 28px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Peak Planner</span>
            {saving && <span style={{ fontSize: 12, color: C.accent, animation: "pulse 1s infinite" }}>Saving</span>}
            {loading && <span style={{ fontSize: 12, color: C.accent, animation: "pulse 1s infinite" }}>Working...</span>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {view === "calendar" && selectedClient && (
              <>
                {/* Year selector */}
                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: C.text, background: C.surface3, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {/* View toggle */}
                <div style={{ display: "flex", background: C.surface2, borderRadius: 8, padding: 2 }}>
                  <button onClick={() => setCalView("list")} style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", background: calView === "list" ? C.surface3 : "transparent", color: calView === "list" ? C.text : C.textTertiary }}>List</button>
                  <button onClick={() => setCalView("calendar")} style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", background: calView === "calendar" ? C.surface3 : "transparent", color: calView === "calendar" ? C.text : C.textTertiary }}>Calendar</button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setView("clients"); setSelectedClient(null); }}>Back</Button>
                <Button variant="secondary" size="sm" onClick={() => setShareModal(selectedClient)}>Share</Button>
                <Button variant="secondary" size="sm" onClick={() => generatePlans(selectedClient, data)} disabled={loading}>Regenerate</Button>
                <Button variant="primary" size="sm" onClick={() => setShowAddEvent(true)}>Add Event</Button>
              </>
            )}
            {view === "clients" && <Button variant="primary" size="sm" onClick={() => setShowNewClient(true)}>New Client</Button>}
          </div>
        </div>
      </nav>

      {error && <div style={{ background: C.red + "10", borderBottom: `1px solid ${C.red}25`, padding: "12px 28px" }}><div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 13, color: C.red }}>{error}</span><Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button></div></div>}

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 28px" }}>

        {view === "clients" && (
          <div className="fade-in">
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 24 }}>Clients</h1>
            {data.clients.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>No clients yet</div>
                <Button variant="primary" size="lg" onClick={() => setShowNewClient(true)}>New Client</Button>
              </div>
            ) : data.clients.map(cl => (
              <div key={cl.id} onClick={() => { setSelectedClient(cl); setView("calendar"); }}
                style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 8, padding: "20px 24px", cursor: "pointer", transition: "border-color 0.15s, transform 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 4 }}>{cl.name}</div>
                    <div style={{ fontSize: 12, color: C.textTertiary }}>{cl.niche} · {(cl.events||[]).length} events · {Object.keys(cl.plans||{}).length} plans</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteClient(cl.id); }}>Delete</Button>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "calendar" && selectedClient && (
          <div className="fade-in">
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>{selectedClient.name} — {selectedYear}</h1>
              <p style={{ fontSize: 14, color: C.textSecondary }}>{(selectedClient.events||[]).length} events · {Object.keys(selectedClient.plans||{}).length} plans · {selectedClient.niche}</p>
            </div>

            {loading && <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ width: 18, height: 18, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: 9, animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 13, color: C.textSecondary }}>{loadingMsg}</span>
            </div>}

            {calView === "list"
              ? <ListView events={selectedClient.events || []} plans={selectedClient.plans || {}} onClickEvent={e => setDetailEvent(e)} />
              : <CalendarGrid events={selectedClient.events || []} plans={selectedClient.plans || {}} year={selectedYear} onClickEvent={e => setDetailEvent(e)} />
            }
          </div>
        )}
      </div>

      {/* EVENT DETAIL */}
      {detailEvent && selectedClient && (
        <EventDetailModal
          event={detailEvent}
          plan={(selectedClient.plans || {})[detailEvent.id]}
          onClose={() => setDetailEvent(null)}
          onSavePlan={(eid, plan) => { savePlanForEvent(eid, plan); }}
          onDeletePlan={(eid) => { deletePlanForEvent(eid); }}
          onGeneratePlan={(evt) => generateSinglePlan(evt)}
          loading={loading}
        />
      )}

      {/* NEW CLIENT */}
      {showNewClient && <Modal title="New Client" onClose={() => setShowNewClient(false)}>
        <Input label="Brand Name" value={brandName} onChange={setBrandName} placeholder="Glow Skin Co" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 6 }}>Niche</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{NICHES.map(n => <Pill key={n} color={C.purple} active={niche === n} onClick={() => setNiche(n)}>{n}</Pill>)}</div>
          {niche === "Other" && <div style={{ marginTop: 8 }}><Input value={customNiche} onChange={setCustomNiche} placeholder="Your niche..." /></div>}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 6 }}>Markets</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{REGIONS.map(r => <Pill key={r} color={C.teal} active={selectedRegions.includes(r)} onClick={() => toggleRegion(r)}>{r}</Pill>)}</div>
        </div>
        <Input label="Monthly Budget" value={monthlyBudget} onChange={setMonthlyBudget} placeholder="$15,000" />
        <Input label="Key Products" value={products} onChange={setProducts} placeholder="Dark spot corrector, vitamin C serum..." textarea rows={2} />
        <Button variant="primary" fullWidth onClick={createClient} disabled={!brandName.trim() || !effectiveNiche || loading}>{loading ? "Creating..." : "Create & Generate"}</Button>
      </Modal>}

      {/* ADD EVENT */}
      {showAddEvent && <Modal title="Add Event" onClose={() => setShowAddEvent(false)}>
        <Input label="Event Name" value={evtName} onChange={setEvtName} placeholder="Summer Launch, Flash Sale..." />
        <Input label="Event Date" value={evtDate} onChange={setEvtDate} type="date" />
        <Button variant="primary" fullWidth onClick={addCustomEvent} disabled={!evtName.trim() || !evtDate}>Add Event</Button>
      </Modal>}

      {/* SHARE */}
      {shareModal && <Modal title="Share with Client" onClose={() => { setShareModal(null); setCopied(false); }}>
        <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 16, lineHeight: 1.5 }}>Send this link to <strong style={{ color: C.text }}>{shareModal.name}</strong>. They can view and suggest events.</p>
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: C.accent, wordBreak: "break-all", marginBottom: 16 }}>{getShareUrl(shareModal)}</div>
        <Button variant="primary" fullWidth onClick={() => copyShareLink(shareModal)}>{copied ? "Copied" : "Copy Link"}</Button>
      </Modal>}

      <footer style={{ padding: "24px 28px", textAlign: "center", marginTop: 40 }}><p style={{ fontSize: 12, color: C.textTertiary }}>Peak Planner · D-DOUBLEU MEDIA</p></footer>
    </div>
  );
}

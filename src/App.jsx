import React, { useState, useMemo, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import * as XLSX from "xlsx";

// ============================================================
//  🎨 THEME
// ============================================================
const THEME = {
  background:  "#f0f4f8",
  cardBg:      "#ffffff",
  cardBorder:  "#dde3ed",
  inputBg:     "#f5f7fa",
  inputBorder: "#c8d0de",
  accent:      "#1a56db",
  accentHover: "#1648c0",
  textPrimary: "#111827",
  textMuted:   "#6b7280",
  textHeading: "#1f2937",
  danger:      "#dc2626",
  spendColor:  "#b45309",
  incomeColor: "#059669",   
  fontBody:    "'IBM Plex Sans', 'Segoe UI', sans-serif",
  fontHeading: "'IBM Plex Sans', 'Segoe UI', sans-serif",
};

const CURRENCY = "฿";

// ============================================================
//  😀 EMOJI PICKER
// ============================================================
const EMOJI_GROUPS = [
  { label:"Finance",  emojis:["💰","💵","💳","🏦","📈","📉","💹","🪙","💸","🧾","📊","🏧"] },
  { label:"Food",     emojis:["🍜","🍕","🍔","🍣","🥗","☕","🧃","🍱","🛒","🥤","🍰","🍺"] },
  { label:"Travel",   emojis:["✈️","🚌","🚗","🚂","🛳️","🏨","🧳","⛽","🗺️","🏖️","🎫","🛺"] },
  { label:"Home",     emojis:["🏠","🏡","💡","🔧","🪴","🛋️","🧹","🚿","🛏️","📦","🔑","🪟"] },
  { label:"Health",   emojis:["💊","🏥","🩺","🧘","🏋️","🦷","👓","🩹","💉","🧬","🏃","🫀"] },
  { label:"Shopping", emojis:["🛍️","👕","👟","💄","⌚","📱","💻","📷","🎒","🧴","🪥","🛒"] },
  { label:"Fun",      emojis:["🎬","🎮","🎵","📚","🎨","🎭","🏆","🎯","🎲","🎸","🎤","⚽"] },
  { label:"Goals",    emojis:["🛡️","⭐","🎯","🚀","🌟","🏅","🥇","💪","🔥","🌈","🦋","🎓"] },
  { label:"Other",    emojis:["📦","📌","🔖","🗂️","📋","🗓️","⚙️","🔔","📣","🏷️","✅","❤️"] },
];

function EmojiPicker({ value, onChange }) {
  const [open, setOpen]          = useState(false);
  const [activeGroup, setActive] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width:54, height:42, borderRadius:10, border:`1px solid ${THEME.inputBorder}`, background:THEME.inputBg, fontSize:22, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {value}
      </button>
      {open && (
        <div style={{ position:"absolute", top:50, left:0, zIndex:2000, background:THEME.cardBg, border:`1px solid ${THEME.cardBorder}`, borderRadius:14, boxShadow:"0 8px 32px rgba(0,0,0,0.13)", width:300, padding:14 }}>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
            {EMOJI_GROUPS.map((g,i) => (
              <button key={i} type="button" onClick={() => setActive(i)}
                style={{ padding:"3px 10px", borderRadius:20, border:"none", cursor:"pointer", fontFamily:THEME.fontBody, fontSize:11, fontWeight:500,
                  background:activeGroup===i?THEME.accent:THEME.inputBg, color:activeGroup===i?"#fff":THEME.textMuted }}>
                {g.label}
              </button>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:4 }}>
            {EMOJI_GROUPS[activeGroup].emojis.map(e => (
              <button key={e} type="button" onClick={() => { onChange(e); setOpen(false); }}
                style={{ fontSize:22, padding:"6px 0", borderRadius:8, border:value===e?`2px solid ${THEME.accent}`:"2px solid transparent",
                  background:value===e?THEME.accent+"18":"transparent", cursor:"pointer" }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  🗄️ localStorage
// ============================================================
const LS = {
  expenses:   "finflow_expenses",
  income:     "finflow_income",
  savings:    "finflow_savings",
  expCats:    "finflow_exp_categories",
  incCats:    "finflow_inc_categories",
};
function lsGet(k, fb) { try { const r=localStorage.getItem(k); return r?JSON.parse(r):fb; } catch { return fb; } }
function lsSet(k, v)  { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

// ============================================================
//  📋 DEFAULT DATA
// ============================================================
const DEFAULT_EXP_CATS = [
  { name:"Food",          color:"#f97316", icon:"🍜" },
  { name:"Transport",     color:"#3b82f6", icon:"🚌" },
  { name:"Housing",       color:"#8b5cf6", icon:"🏠" },
  { name:"Health",        color:"#10b981", icon:"💊" },
  { name:"Shopping",      color:"#ec4899", icon:"🛍️" },
  { name:"Entertainment", color:"#f59e0b", icon:"🎬" },
  { name:"Other",         color:"#6b7280", icon:"📦" },
];
const DEFAULT_INC_CATS = [
  { name:"Salary",     color:"#059669", icon:"💵" },
  { name:"Freelance",  color:"#0891b2", icon:"💻" },
  { name:"Investment", color:"#7c3aed", icon:"📈" },
  { name:"Gift",       color:"#db2777", icon:"🎁" },
  { name:"Other",      color:"#6b7280", icon:"💰" },
];
const DEFAULT_SAVINGS = [
  { id:1, name:"Emergency Fund", target:50000, saved:18000, color:"#10b981", icon:"🛡️" },
  { id:2, name:"Japan Trip",     target:80000, saved:32000, color:"#3b82f6", icon:"✈️"  },
  { id:3, name:"New Laptop",     target:45000, saved:12000, color:"#f97316", icon:"💻" },
];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmt(n) { return CURRENCY + Number(n).toLocaleString(); }

// ── Modal ─────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:THEME.cardBg, border:`1px solid ${THEME.cardBorder}`, borderRadius:20, padding:28, minWidth:400, maxWidth:520, width:"90%", boxShadow:"0 12px 40px rgba(0,0,0,0.12)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <p style={{ fontFamily:THEME.fontHeading, fontSize:18, fontWeight:700, color:THEME.textHeading }}>{title}</p>
          <button onClick={onClose} style={{ background:"none", border:"none", color:THEME.textMuted, cursor:"pointer", fontSize:20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Reusable Transaction List ─────────────────────────────────
function TransactionForm({ newItem, setNewItem, categories, onAdd, type }) {
  const inp = { background:THEME.inputBg, border:`1px solid ${THEME.inputBorder}`, borderRadius:10, padding:"10px 14px", color:THEME.textPrimary, fontFamily:THEME.fontBody, fontSize:14, width:"100%", outline:"none" };
  const color = type === "income" ? THEME.incomeColor : THEME.spendColor;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"140px 1fr 130px 160px auto", gap:10, alignItems:"end" }}>
      <div>
        <p style={{ fontSize:11, color:THEME.textMuted, marginBottom:5, fontWeight:600 }}>DATE</p>
        <input type="date" style={inp} value={newItem.date} onChange={e=>setNewItem(p=>({...p,date:e.target.value}))} />
      </div>
      <div>
        <p style={{ fontSize:11, color:THEME.textMuted, marginBottom:5, fontWeight:600 }}>DESCRIPTION</p>
        <input style={inp} placeholder={type==="income"?"Where did it come from?":"What did you spend on?"} value={newItem.desc}
          onChange={e=>setNewItem(p=>({...p,desc:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&onAdd()} />
      </div>
      <div>
        <p style={{ fontSize:11, color:THEME.textMuted, marginBottom:5, fontWeight:600 }}>AMOUNT ({CURRENCY})</p>
        <input type="number" style={inp} placeholder="0" value={newItem.amount}
          onChange={e=>setNewItem(p=>({...p,amount:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&onAdd()} />
      </div>
      <div>
        <p style={{ fontSize:11, color:THEME.textMuted, marginBottom:5, fontWeight:600 }}>CATEGORY</p>
        <select style={inp} value={newItem.category} onChange={e=>setNewItem(p=>({...p,category:e.target.value}))}>
          {categories.map(c=><option key={c.name}>{c.name}</option>)}
        </select>
      </div>
      <button onClick={onAdd}
        style={{ background:color, color:"#fff", border:"none", borderRadius:10, padding:"10px 20px", fontWeight:600, cursor:"pointer", fontFamily:THEME.fontBody, fontSize:14, whiteSpace:"nowrap" }}>
        + Add
      </button>
    </div>
  );
}

// ── Category Manager Modal Content ───────────────────────────
function CatModalContent({ categories, newCat, setNewCat, onAdd, onDelete }) {
  const inp = { background:THEME.inputBg, border:`1px solid ${THEME.inputBorder}`, borderRadius:10, padding:"10px 14px", color:THEME.textPrimary, fontFamily:THEME.fontBody, fontSize:14, width:"100%", outline:"none" };
  return (
    <>
      <div style={{ display:"flex", gap:8, marginBottom:20, alignItems:"flex-end" }}>
        <div>
          <p style={{ fontSize:11, color:THEME.textMuted, marginBottom:5, fontWeight:600 }}>ICON</p>
          <EmojiPicker value={newCat.icon} onChange={v=>setNewCat(p=>({...p,icon:v}))} />
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:11, color:THEME.textMuted, marginBottom:5, fontWeight:600 }}>NAME</p>
          <input style={inp} placeholder="Category name" value={newCat.name}
            onChange={e=>setNewCat(p=>({...p,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&onAdd()} />
        </div>
        <div>
          <p style={{ fontSize:11, color:THEME.textMuted, marginBottom:5, fontWeight:600 }}>COLOR</p>
          <input type="color" value={newCat.color} onChange={e=>setNewCat(p=>({...p,color:e.target.value}))}
            style={{ width:46, height:42, borderRadius:10, border:`1px solid ${THEME.inputBorder}`, background:"none", cursor:"pointer", padding:2 }} />
        </div>
        <button onClick={onAdd}
          style={{ background:THEME.accent, color:"#fff", border:"none", borderRadius:10, padding:"10px 16px", fontWeight:600, cursor:"pointer", fontFamily:THEME.fontBody, fontSize:14, whiteSpace:"nowrap" }}>
          + Add
        </button>
      </div>
      <div style={{ maxHeight:280, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
        {categories.map(c => (
          <div key={c.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:THEME.inputBg, borderRadius:10 }}>
            <span style={{ fontSize:20 }}>{c.icon}</span>
            <span style={{ flex:1, fontSize:14, fontWeight:500 }}>{c.name}</span>
            <span style={{ width:14, height:14, borderRadius:"50%", background:c.color, flexShrink:0 }} />
            <button onClick={()=>onDelete(c.name)} style={{ background:"none", border:"none", color:THEME.danger, cursor:"pointer", fontSize:15, padding:"4px 8px", borderRadius:6 }}>✕</button>
          </div>
        ))}
      </div>
      <p style={{ fontSize:11, color:THEME.textMuted, marginTop:12 }}>⚠️ Can't delete a category that has transactions assigned to it.</p>
    </>
  );
}

export default function App() {
  const [tab, setTab] = useState("dashboard");

  // ── State ────────────────────────────────────────────────────
  const [expenses,  setExpenses]  = useState(() => lsGet(LS.expenses, []));
  const [income,    setIncome]    = useState(() => lsGet(LS.income,   []));
  const [savings,   setSavings]   = useState(() => lsGet(LS.savings,  DEFAULT_SAVINGS));
  const [expCats,   setExpCats]   = useState(() => lsGet(LS.expCats,  DEFAULT_EXP_CATS));
  const [incCats,   setIncCats]   = useState(() => lsGet(LS.incCats,  DEFAULT_INC_CATS));

  // ── Auto-save ────────────────────────────────────────────────
  useEffect(() => { lsSet(LS.expenses, expenses); }, [expenses]);
  useEffect(() => { lsSet(LS.income,   income);   }, [income]);
  useEffect(() => { lsSet(LS.savings,  savings);  }, [savings]);
  useEffect(() => { lsSet(LS.expCats,  expCats);  }, [expCats]);
  useEffect(() => { lsSet(LS.incCats,  incCats);  }, [incCats]);

  // ── Form state ───────────────────────────────────────────────
  const today = new Date().toISOString().slice(0,10);
  const [newExp, setNewExp] = useState({ date:today, desc:"", amount:"", category:DEFAULT_EXP_CATS[0].name });
  const [newInc, setNewInc] = useState({ date:today, desc:"", amount:"", category:DEFAULT_INC_CATS[0].name });
  const [newSav, setNewSav] = useState({ name:"", target:"", saved:"", icon:"💰", color:"#1a56db" });
  const [newExpCat, setNewExpCat] = useState({ name:"", color:"#f97316", icon:"📦" });
  const [newIncCat, setNewIncCat] = useState({ name:"", color:"#059669", icon:"💰" });

  const [calMonth, setCalMonth]         = useState(new Date().getMonth());
  const [calYear,  setCalYear]          = useState(new Date().getFullYear());
  const [addSavingToId, setAddSavingToId] = useState(null);
  const [addAmount, setAddAmount]       = useState("");
  const [toast, setToast]               = useState(null);
  const [modal, setModal]               = useState(null); 
  const importRef = useRef();
  const now = new Date();

  // ── Computed ─────────────────────────────────────────────────
  const thisMonthExp = expenses.filter(e => { const d=new Date(e.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); });
  const thisMonthInc = income.filter(e =>   { const d=new Date(e.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); });
  const totalExpMonth = thisMonthExp.reduce((a,e)=>a+e.amount,0);
  const totalIncMonth = thisMonthInc.reduce((a,e)=>a+e.amount,0);
  const netBalance    = totalIncMonth - totalExpMonth;
  const totalSaved    = savings.reduce((a,s)=>a+s.saved,0);
  const totalTarget   = savings.reduce((a,s)=>a+s.target,0);

  const expCatData = useMemo(()=>expCats.map(c=>({ name:c.name, color:c.color, value:expenses.filter(e=>e.category===c.name).reduce((a,e)=>a+e.amount,0) })).filter(c=>c.value>0),[expenses,expCats]);

  const monthlyData = useMemo(()=>MONTHS.map((m,i)=>({
    month: m,
    income:   income.filter(e=>new Date(e.date).getMonth()===i&&new Date(e.date).getFullYear()===now.getFullYear()).reduce((a,e)=>a+e.amount,0),
    expenses: expenses.filter(e=>new Date(e.date).getMonth()===i&&new Date(e.date).getFullYear()===now.getFullYear()).reduce((a,e)=>a+e.amount,0),
  })),[expenses,income]);

  // Calendar
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate(), firstDay=new Date(calYear,calMonth,1).getDay();
  const calItems={};
  [...expenses.map(e=>({...e,type:"exp"})),...income.map(e=>({...e,type:"inc"}))].forEach(e=>{
    const d=new Date(e.date);
    if(d.getMonth()===calMonth&&d.getFullYear()===calYear){const day=d.getDate();if(!calItems[day])calItems[day]=[];calItems[day].push(e);}
  });

  function showToast(msg,type="success"){setToast({msg,type});setTimeout(()=>setToast(null),3000);}
  function getExpCat(name){return expCats.find(c=>c.name===name)||{color:"#6b7280",icon:"📦"};}
  function getIncCat(name){return incCats.find(c=>c.name===name)||{color:"#059669",icon:"💰"};}

  // ── CRUD ─────────────────────────────────────────────────────
  function addExpense(){if(!newExp.desc.trim()||!newExp.amount)return;setExpenses(p=>[...p,{...newExp,id:Date.now(),amount:parseFloat(newExp.amount)}]);setNewExp(p=>({...p,desc:"",amount:""}));showToast("Expense added!");}
  function addIncomeEntry(){if(!newInc.desc.trim()||!newInc.amount)return;setIncome(p=>[...p,{...newInc,id:Date.now(),amount:parseFloat(newInc.amount)}]);setNewInc(p=>({...p,desc:"",amount:""}));showToast("Income added!");}
  function deleteExpense(id){setExpenses(p=>p.filter(e=>e.id!==id));showToast("Deleted.","error");}
  function deleteIncome(id) {setIncome(p=>p.filter(e=>e.id!==id));showToast("Deleted.","error");}

  function addSavingGoal(){if(!newSav.name.trim()||!newSav.target)return;setSavings(p=>[...p,{...newSav,id:Date.now(),target:parseFloat(newSav.target),saved:parseFloat(newSav.saved)||0}]);setNewSav({name:"",target:"",saved:"",icon:"💰",color:"#1a56db"});showToast("Goal created!");}
  function deleteSaving(id){setSavings(p=>p.filter(s=>s.id!==id));showToast("Deleted.","error");}
  function addToSaving(){if(!addAmount)return;setSavings(p=>p.map(s=>s.id===addSavingToId?{...s,saved:Math.min(s.saved+parseFloat(addAmount),s.target)}:s));setAddSavingToId(null);setAddAmount("");showToast("Savings updated!");}

  function addCat(cats, setCats, newCat, setNewCat, defaultColor) {
    if(!newCat.name.trim())return;
    if(cats.find(c=>c.name.toLowerCase()===newCat.name.toLowerCase())){showToast("Already exists.","error");return;}
    setCats(p=>[...p,{...newCat}]);setNewCat({name:"",color:defaultColor,icon:"⭐"});showToast("Category added!");
  }
  function delExpCat(name){if(expenses.find(e=>e.category===name)){showToast("Has expenses — can't delete.","error");return;}setExpCats(p=>p.filter(c=>c.name!==name));showToast("Deleted.");}
  function delIncCat(name){if(income.find(e=>e.category===name)){showToast("Has income — can't delete.","error");return;}setIncCats(p=>p.filter(c=>c.name!==name));showToast("Deleted.");}

  function clearAllData(){
    setExpenses([]);setIncome([]);setSavings(DEFAULT_SAVINGS);setExpCats(DEFAULT_EXP_CATS);setIncCats(DEFAULT_INC_CATS);
    Object.values(LS).forEach(k=>localStorage.removeItem(k));
    setModal(null);showToast("All data cleared.","error");
  }

  // ── Excel ─────────────────────────────────────────────────────
  function exportToExcel(){
    const wb=XLSX.utils.book_new();
    const es=XLSX.utils.json_to_sheet(expenses.length?expenses.map(e=>({ID:e.id,Date:e.date,Description:e.desc,Amount:e.amount,Category:e.category})):[{ID:"",Date:"",Description:"",Amount:"",Category:""}]);
    es["!cols"]=[{wch:15},{wch:14},{wch:30},{wch:12},{wch:16}];
    XLSX.utils.book_append_sheet(wb,es,"Expenses");
    const is=XLSX.utils.json_to_sheet(income.length?income.map(e=>({ID:e.id,Date:e.date,Description:e.desc,Amount:e.amount,Category:e.category})):[{ID:"",Date:"",Description:"",Amount:"",Category:""}]);
    is["!cols"]=[{wch:15},{wch:14},{wch:30},{wch:12},{wch:16}];
    XLSX.utils.book_append_sheet(wb,is,"Income");
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(savings.map(s=>({ID:s.id,Name:s.name,Icon:s.icon,Target:s.target,Saved:s.saved,Color:s.color}))),"Savings");
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(expCats.map(c=>({Name:c.name,Color:c.color,Icon:c.icon}))),"ExpenseCategories");
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(incCats.map(c=>({Name:c.name,Color:c.color,Icon:c.icon}))),"IncomeCategories");
    XLSX.writeFile(wb,"finflow_data.xlsx");showToast("Exported!");
  }
  function importFromExcel(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=evt=>{try{
      const wb=XLSX.read(evt.target.result,{type:"binary"});
      const readRows=(sheet,filter,map)=>{if(!wb.SheetNames.includes(sheet))return null;return XLSX.utils.sheet_to_json(wb.Sheets[sheet]).filter(filter).map(map);};
      const exps=readRows("Expenses",r=>r.Description&&r.Amount,r=>({id:r.ID||Date.now()+Math.random(),date:r.Date?String(r.Date).slice(0,10):today,desc:r.Description,amount:parseFloat(r.Amount),category:r.Category||"Other"}));
      if(exps)setExpenses(exps);
      const incs=readRows("Income",r=>r.Description&&r.Amount,r=>({id:r.ID||Date.now()+Math.random(),date:r.Date?String(r.Date).slice(0,10):today,desc:r.Description,amount:parseFloat(r.Amount),category:r.Category||"Other"}));
      if(incs)setIncome(incs);
      const savs=readRows("Savings",r=>r.Name&&r.Target,r=>({id:r.ID||Date.now()+Math.random(),name:r.Name,icon:r.Icon||"💰",target:parseFloat(r.Target),saved:parseFloat(r.Saved)||0,color:r.Color||THEME.accent}));
      if(savs&&savs.length)setSavings(savs);
      const ec=readRows("ExpenseCategories",r=>r.Name,r=>({name:r.Name,color:r.Color||"#6b7280",icon:r.Icon||"📦"}));
      if(ec&&ec.length)setExpCats(ec);
      const ic=readRows("IncomeCategories",r=>r.Name,r=>({name:r.Name,color:r.Color||"#059669",icon:r.Icon||"💰"}));
      if(ic&&ic.length)setIncCats(ic);
      showToast("Imported successfully!");
    }catch{showToast("Import failed.","error");}};
    reader.readAsBinaryString(file);e.target.value="";
  }

  const tabs=[
    {id:"dashboard", label:"Dashboard", icon:"◈"},
    {id:"income",    label:"Income",    icon:"＋"},
    {id:"expenses",  label:"Expenses",  icon:"⊟"},
    {id:"savings",   label:"Savings",   icon:"◎"},
    {id:"calendar",  label:"Calendar",  icon:"▦"},
  ];

  const inp={background:THEME.inputBg,border:`1px solid ${THEME.inputBorder}`,borderRadius:10,padding:"10px 14px",color:THEME.textPrimary,fontFamily:THEME.fontBody,fontSize:14,width:"100%",outline:"none"};

  return (
    <div style={{fontFamily:THEME.fontBody,background:THEME.background,minHeight:"100vh",color:THEME.textPrimary}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#c8d0de;border-radius:2px;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn 0.3s ease forwards;}
        .toast{position:fixed;bottom:28px;right:28px;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:500;z-index:1100;animation:slideUp 0.3s ease;}
        .card{background:${THEME.cardBg};border:1px solid ${THEME.cardBorder};border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,0.06);}
        .btn-ghost{background:none;border:1px solid ${THEME.inputBorder};color:${THEME.textHeading};border-radius:10px;padding:9px 16px;font-weight:500;cursor:pointer;font-family:inherit;font-size:13px;transition:all 0.2s;display:flex;align-items:center;gap:6px;}
        .btn-ghost:hover{border-color:${THEME.accent};color:${THEME.accent};}
        .btn-danger-outline{background:none;border:1px solid ${THEME.danger}44;color:${THEME.danger};border-radius:10px;padding:9px 14px;font-weight:500;cursor:pointer;font-family:inherit;font-size:13px;}
        .btn-danger-outline:hover{background:${THEME.danger}11;}
        .btn-icon{background:none;border:none;color:${THEME.danger};cursor:pointer;font-size:15px;padding:4px 8px;border-radius:6px;}
        .btn-icon:hover{background:${THEME.danger}18;}
        input[type=date]::-webkit-calendar-picker-indicator{cursor:pointer;opacity:0.5;}
        select option{background:${THEME.cardBg};color:${THEME.textPrimary};}
      `}</style>

      {toast&&<div className="toast" style={{background:toast.type==="error"?`${THEME.danger}18`:`${THEME.accent}18`,border:`1px solid ${toast.type==="error"?THEME.danger:THEME.accent}`,color:toast.type==="error"?THEME.danger:THEME.accent}}>{toast.type==="error"?"✕ ":"✓ "}{toast.msg}</div>}

      {/* Expense Category Modal */}
      {modal==="expCat"&&<Modal title="Manage Expense Categories" onClose={()=>setModal(null)}>
        <CatModalContent categories={expCats} newCat={newExpCat} setNewCat={setNewExpCat} onAdd={()=>addCat(expCats,setExpCats,newExpCat,setNewExpCat,"#f97316")} onDelete={delExpCat}/>
      </Modal>}

      {/* Income Category Modal */}
      {modal==="incCat"&&<Modal title="Manage Income Categories" onClose={()=>setModal(null)}>
        <CatModalContent categories={incCats} newCat={newIncCat} setNewCat={setNewIncCat} onAdd={()=>addCat(incCats,setIncCats,newIncCat,setNewIncCat,"#059669")} onDelete={delIncCat}/>
      </Modal>}

      {/* Clear confirm */}
      {modal==="clear"&&<Modal title="⚠️ Clear All Data?" onClose={()=>setModal(null)}>
        <p style={{color:THEME.textMuted,fontSize:14,marginBottom:24,lineHeight:1.6}}>This will permanently delete all expenses, income, savings, and categories. This cannot be undone.</p>
        <div style={{display:"flex",gap:10}}>
          <button className="btn-ghost" onClick={()=>setModal(null)} style={{flex:1,justifyContent:"center"}}>Cancel</button>
          <button onClick={clearAllData} style={{flex:1,background:THEME.danger,color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Yes, Clear Everything</button>
        </div>
      </Modal>}

      {/* Header */}
      <div style={{background:THEME.cardBg,borderBottom:`1px solid ${THEME.cardBorder}`,padding:"0 24px",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <span style={{fontSize:20,fontFamily:THEME.fontHeading,fontWeight:700,color:THEME.textHeading}}>
            <span style={{color:THEME.accent}}>My</span>Pocket
            <span style={{fontSize:10,color:THEME.textMuted,fontWeight:400,marginLeft:8}}>● auto-saving</span>
          </span>
          <nav style={{display:"flex",gap:4}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?THEME.accent:"transparent",color:tab===t.id?"#fff":THEME.textMuted,border:"none",borderRadius:8,padding:"8px 14px",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:THEME.fontBody,transition:"all 0.2s"}}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
          <div style={{display:"flex",gap:8}}>
            <input ref={importRef} type="file" accept=".xlsx" style={{display:"none"}} onChange={importFromExcel}/>
            <button className="btn-ghost" onClick={()=>importRef.current.click()}>📥 Import</button>
            <button className="btn-ghost" onClick={exportToExcel} style={{borderColor:THEME.accent,color:THEME.accent}}>📤 Export</button>
            <button className="btn-danger-outline" onClick={()=>setModal("clear")} title="Clear all data">🗑️</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"28px 24px"}}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <div className="fade-in">
            <p style={{fontFamily:THEME.fontHeading,fontSize:26,fontWeight:700,marginBottom:24,color:THEME.textHeading}}>Your Money Life Cycle</p>

            {/* Stat cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
              {[
                {label:"Income This Month",  value:fmt(totalIncMonth), sub:`${thisMonthInc.length} transactions`, accent:THEME.incomeColor},
                {label:"Spent This Month",   value:fmt(totalExpMonth), sub:`${thisMonthExp.length} transactions`, accent:THEME.spendColor},
                {label:"Net Balance",        value:fmt(netBalance),    sub:netBalance>=0?"Surplus this month":"Deficit this month", accent:netBalance>=0?THEME.incomeColor:THEME.danger},
                {label:"Total Saved",        value:fmt(totalSaved),    sub:totalTarget>0?`${Math.round(totalSaved/totalTarget*100)}% of goals`:"No goals yet", accent:THEME.accent},
              ].map((s,i)=>(
                <div key={i} className="card" style={{padding:"18px 20px"}}>
                  <p style={{fontSize:11,color:THEME.textMuted,marginBottom:8,textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>{s.label}</p>
                  <p style={{fontSize:24,fontFamily:THEME.fontHeading,fontWeight:700,color:s.accent}}>{s.value}</p>
                  <p style={{fontSize:12,color:THEME.textMuted,marginTop:4}}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16,marginBottom:16}}>
              <div className="card" style={{padding:20}}>
                <p style={{fontSize:13,fontWeight:600,marginBottom:16,color:THEME.textHeading}}>Income vs Expenses {now.getFullYear()}</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} barSize={10} barGap={2}>
                    <XAxis dataKey="month" tick={{fill:THEME.textMuted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis hide/>
                    <Tooltip contentStyle={{background:THEME.cardBg,border:`1px solid ${THEME.cardBorder}`,borderRadius:8,color:THEME.textPrimary,fontSize:12}} formatter={v=>fmt(v)}/>
                    <Legend wrapperStyle={{fontSize:12,color:THEME.textMuted}}/>
                    <Bar dataKey="income"   name="Income"   fill={THEME.incomeColor} radius={[3,3,0,0]}/>
                    <Bar dataKey="expenses" name="Expenses" fill={THEME.spendColor}  radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card" style={{padding:20}}>
                <p style={{fontSize:13,fontWeight:600,marginBottom:12,color:THEME.textHeading}}>Spending by Category</p>
                {expCatData.length===0
                  ?<div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",color:THEME.textMuted,fontSize:13}}>No expenses yet</div>
                  :<div style={{display:"flex",alignItems:"center",gap:16}}>
                    <ResponsiveContainer width={150} height={150}>
                      <PieChart><Pie data={expCatData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" paddingAngle={2}>
                        {expCatData.map((c,i)=><Cell key={i} fill={c.color}/>)}
                      </Pie></PieChart>
                    </ResponsiveContainer>
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                      {expCatData.map((c,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:c.color,flexShrink:0}}/>
                          <span style={{color:THEME.textMuted,flex:1}}>{c.name}</span>
                          <span style={{fontWeight:600,color:THEME.textHeading}}>{fmt(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              </div>
            </div>

            {/* Recent transactions — both income & expense */}
            <div className="card" style={{padding:20}}>
              <p style={{fontSize:13,fontWeight:600,marginBottom:14,color:THEME.textHeading}}>Recent Transactions</p>
              {(expenses.length===0&&income.length===0)
                ?<p style={{color:THEME.textMuted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No transactions yet.</p>
                :[
                    ...expenses.map(e=>({...e,type:"exp"})),
                    ...income.map(e=>({...e,type:"inc"}))
                  ].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6).map(e=>{
                    const cat = e.type==="exp" ? getExpCat(e.category) : getIncCat(e.category);
                    const isInc = e.type==="inc";
                    return(
                      <div key={e.id+e.type} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${THEME.inputBg}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <span style={{width:36,height:36,borderRadius:10,background:cat.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{cat.icon}</span>
                          <div>
                            <p style={{fontSize:14,fontWeight:500,color:THEME.textHeading}}>{e.desc}</p>
                            <p style={{fontSize:11,color:THEME.textMuted}}>{e.date} · {e.category} · <span style={{color:isInc?THEME.incomeColor:THEME.spendColor,fontWeight:600}}>{isInc?"Income":"Expense"}</span></p>
                          </div>
                        </div>
                        <span style={{color:isInc?THEME.incomeColor:THEME.spendColor,fontWeight:700,fontSize:15}}>
                          {isInc?"+":"-"}{fmt(e.amount)}
                        </span>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}

        {/* ── INCOME ── */}
        {tab==="income"&&(
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <p style={{fontFamily:THEME.fontHeading,fontSize:26,fontWeight:700,color:THEME.textHeading}}>Income Tracker</p>
              <button className="btn-ghost" onClick={()=>setModal("incCat")}>🏷️ Manage Categories</button>
            </div>
            <div className="card" style={{padding:20,marginBottom:20}}>
              <p style={{fontSize:13,fontWeight:600,marginBottom:14,color:THEME.textHeading}}>Add New Income</p>
              <TransactionForm newItem={newInc} setNewItem={setNewInc} categories={incCats} onAdd={addIncomeEntry} type="income"/>
              <p style={{fontSize:11,color:THEME.textMuted,marginTop:10}}>💡 Press <b>Enter</b> to quickly add · Data saves automatically</p>
            </div>
            <div className="card" style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <p style={{fontSize:13,fontWeight:600,color:THEME.textHeading}}>All Income ({income.length})</p>
                <p style={{fontSize:13,color:THEME.incomeColor,fontWeight:600}}>Total: +{fmt(income.reduce((a,e)=>a+e.amount,0))}</p>
              </div>
              {income.length===0
                ?<p style={{color:THEME.textMuted,fontSize:13,textAlign:"center",padding:"30px 0"}}>No income recorded yet. Add your first one above!</p>
                :[...income].reverse().map(e=>{
                  const cat=getIncCat(e.category);
                  return(
                    <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`1px solid ${THEME.inputBg}`}}>
                      <span style={{fontSize:18,width:28,textAlign:"center"}}>{cat.icon}</span>
                      <span style={{fontSize:12,color:THEME.textMuted,width:90,flexShrink:0}}>{e.date}</span>
                      <span style={{flex:1,fontSize:14,color:THEME.textHeading}}>{e.desc}</span>
                      <span style={{fontSize:12,padding:"3px 10px",borderRadius:20,background:cat.color+"18",color:cat.color,fontWeight:500}}>{e.category}</span>
                      <span style={{color:THEME.incomeColor,fontWeight:600,width:90,textAlign:"right"}}>+{fmt(e.amount)}</span>
                      <button className="btn-icon" onClick={()=>deleteIncome(e.id)}>✕</button>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* ── EXPENSES ── */}
        {tab==="expenses"&&(
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <p style={{fontFamily:THEME.fontHeading,fontSize:26,fontWeight:700,color:THEME.textHeading}}>Expense Tracker</p>
              <button className="btn-ghost" onClick={()=>setModal("expCat")}>🏷️ Manage Categories</button>
            </div>
            <div className="card" style={{padding:20,marginBottom:20}}>
              <p style={{fontSize:13,fontWeight:600,marginBottom:14,color:THEME.textHeading}}>Add New Expense</p>
              <TransactionForm newItem={newExp} setNewItem={setNewExp} categories={expCats} onAdd={addExpense} type="expense"/>
              <p style={{fontSize:11,color:THEME.textMuted,marginTop:10}}>💡 Press <b>Enter</b> to quickly add · Data saves automatically</p>
            </div>
            <div className="card" style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <p style={{fontSize:13,fontWeight:600,color:THEME.textHeading}}>All Expenses ({expenses.length})</p>
                <p style={{fontSize:13,color:THEME.spendColor,fontWeight:600}}>Total: -{fmt(expenses.reduce((a,e)=>a+e.amount,0))}</p>
              </div>
              {expenses.length===0
                ?<p style={{color:THEME.textMuted,fontSize:13,textAlign:"center",padding:"30px 0"}}>No expenses yet. Add your first one above!</p>
                :[...expenses].reverse().map(e=>{
                  const cat=getExpCat(e.category);
                  return(
                    <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`1px solid ${THEME.inputBg}`}}>
                      <span style={{fontSize:18,width:28,textAlign:"center"}}>{cat.icon}</span>
                      <span style={{fontSize:12,color:THEME.textMuted,width:90,flexShrink:0}}>{e.date}</span>
                      <span style={{flex:1,fontSize:14,color:THEME.textHeading}}>{e.desc}</span>
                      <span style={{fontSize:12,padding:"3px 10px",borderRadius:20,background:cat.color+"18",color:cat.color,fontWeight:500}}>{e.category}</span>
                      <span style={{color:THEME.spendColor,fontWeight:600,width:90,textAlign:"right"}}>-{fmt(e.amount)}</span>
                      <button className="btn-icon" onClick={()=>deleteExpense(e.id)}>✕</button>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* ── SAVINGS ── */}
        {tab==="savings"&&(
          <div className="fade-in">
            <p style={{fontFamily:THEME.fontHeading,fontSize:26,fontWeight:700,marginBottom:24,color:THEME.textHeading}}>Savings Goals</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,marginBottom:24}}>
              {savings.map(s=>{
                const pct=Math.min(100,Math.round(s.saved/s.target*100)),done=pct>=100;
                return(
                  <div key={s.id} className="card" style={{padding:22,position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${s.color} ${pct}%,${THEME.inputBg} ${pct}%)`}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                      <div>
                        <span style={{fontSize:26}}>{s.icon}</span>
                        <p style={{fontSize:16,fontWeight:600,marginTop:6,color:THEME.textHeading}}>{s.name}</p>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {done&&<span style={{fontSize:11,background:THEME.accent,color:"#fff",padding:"3px 10px",borderRadius:20,fontWeight:700}}>DONE ✓</span>}
                        <button className="btn-icon" onClick={()=>deleteSaving(s.id)}>🗑️</button>
                      </div>
                    </div>
                    <div style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}>
                        <span style={{color:THEME.textMuted}}>Saved</span>
                        <span style={{fontWeight:600,color:THEME.textHeading}}>{fmt(s.saved)} / {fmt(s.target)}</span>
                      </div>
                      <div style={{height:6,background:THEME.inputBg,borderRadius:3}}>
                        <div style={{height:"100%",width:`${pct}%`,background:s.color,borderRadius:3,transition:"width 0.5s ease"}}/>
                      </div>
                      <p style={{fontSize:12,color:s.color,marginTop:5,fontWeight:600}}>{pct}% · {fmt(s.target-s.saved)} remaining</p>
                    </div>
                    {!done&&(addSavingToId===s.id?(
                      <div style={{display:"flex",gap:8}}>
                        <input type="number" style={{...inp,flex:1}} placeholder="Amount to add" value={addAmount} onChange={e=>setAddAmount(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addToSaving()} autoFocus/>
                        <button onClick={addToSaving} style={{background:THEME.accent,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:600,cursor:"pointer",fontFamily:THEME.fontBody,fontSize:14}}>Add</button>
                        <button onClick={()=>setAddSavingToId(null)} style={{background:"none",border:`1px solid ${THEME.inputBorder}`,borderRadius:10,color:THEME.textMuted,cursor:"pointer",padding:"0 12px",fontSize:12}}>✕</button>
                      </div>
                    ):(
                      <button onClick={()=>setAddSavingToId(s.id)} style={{background:s.color+"18",color:s.color,border:`1px solid ${s.color}44`,borderRadius:10,padding:"8px 16px",cursor:"pointer",fontFamily:THEME.fontBody,fontWeight:600,fontSize:13,width:"100%"}}>
                        + Add Money
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="card" style={{padding:20}}>
              <p style={{fontSize:13,fontWeight:600,marginBottom:14,color:THEME.textHeading}}>Create New Goal</p>
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto 130px 130px auto",gap:10,alignItems:"end"}}>
                <div>
                  <p style={{fontSize:11,color:THEME.textMuted,marginBottom:5,fontWeight:600}}>ICON</p>
                  <EmojiPicker value={newSav.icon} onChange={v=>setNewSav(p=>({...p,icon:v}))}/>
                </div>
                <div>
                  <p style={{fontSize:11,color:THEME.textMuted,marginBottom:5,fontWeight:600}}>GOAL NAME</p>
                  <input style={inp} placeholder="e.g. New Car" value={newSav.name} onChange={e=>setNewSav(p=>({...p,name:e.target.value}))}/>
                </div>
                <div>
                  <p style={{fontSize:11,color:THEME.textMuted,marginBottom:5,fontWeight:600}}>COLOR</p>
                  <input type="color" value={newSav.color} onChange={e=>setNewSav(p=>({...p,color:e.target.value}))} style={{width:46,height:42,borderRadius:10,border:`1px solid ${THEME.inputBorder}`,background:"none",cursor:"pointer",padding:2}}/>
                </div>
                <div>
                  <p style={{fontSize:11,color:THEME.textMuted,marginBottom:5,fontWeight:600}}>TARGET ({CURRENCY})</p>
                  <input type="number" style={inp} placeholder="100000" value={newSav.target} onChange={e=>setNewSav(p=>({...p,target:e.target.value}))}/>
                </div>
                <div>
                  <p style={{fontSize:11,color:THEME.textMuted,marginBottom:5,fontWeight:600}}>ALREADY SAVED</p>
                  <input type="number" style={inp} placeholder="0" value={newSav.saved} onChange={e=>setNewSav(p=>({...p,saved:e.target.value}))}/>
                </div>
                <button onClick={addSavingGoal} style={{background:THEME.accent,color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontWeight:600,cursor:"pointer",fontFamily:THEME.fontBody,fontSize:14,whiteSpace:"nowrap"}}>+ Create</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CALENDAR ── */}
        {tab==="calendar"&&(
          <div className="fade-in">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
              <p style={{fontFamily:THEME.fontHeading,fontSize:26,fontWeight:700,color:THEME.textHeading}}>{MONTHS[calMonth]} {calYear}</p>
              <div style={{display:"flex",gap:8}}>
                {[["‹",()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}],
                  ["›",()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}]].map(([l,fn])=>(
                  <button key={l} onClick={fn} style={{padding:"8px 16px",borderRadius:10,border:`1px solid ${THEME.inputBorder}`,color:THEME.textHeading,background:THEME.cardBg,cursor:"pointer",fontSize:18,fontWeight:500}}>{l}</button>
                ))}
              </div>
            </div>
            <div className="card" style={{padding:20}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
                  <div key={d} style={{textAlign:"center",fontSize:11,color:THEME.textMuted,fontWeight:600,padding:"6px 0",textTransform:"uppercase",letterSpacing:0.5}}>{d}</div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
                {Array.from({length:daysInMonth}).map((_,i)=>{
                  const day=i+1, dayItems=calItems[day]||[];
                  const dayExp=dayItems.filter(e=>e.type==="exp").reduce((a,e)=>a+e.amount,0);
                  const dayInc=dayItems.filter(e=>e.type==="inc").reduce((a,e)=>a+e.amount,0);
                  const todayObj=new Date(), isToday=day===todayObj.getDate()&&calMonth===todayObj.getMonth()&&calYear===todayObj.getFullYear();
                  return(
                    <div key={day} style={{minHeight:80,background:isToday?THEME.accent+"14":THEME.inputBg,border:`1px solid ${isToday?THEME.accent:THEME.cardBorder}`,borderRadius:10,padding:8}}>
                      <p style={{fontSize:13,fontWeight:isToday?700:500,color:isToday?THEME.accent:THEME.textHeading,marginBottom:4}}>{day}</p>
                      {dayItems.slice(0,2).map((e,ei)=>{
                        const cat=e.type==="exp"?getExpCat(e.category):getIncCat(e.category);
                        return <div key={ei} style={{fontSize:10,padding:"2px 5px",borderRadius:4,background:cat.color+"22",color:cat.color,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{cat.icon} {e.desc}</div>;
                      })}
                      {dayInc>0&&<p style={{fontSize:10,color:THEME.incomeColor,fontWeight:600,marginTop:1}}>+{fmt(dayInc)}</p>}
                      {dayExp>0&&<p style={{fontSize:10,color:THEME.spendColor, fontWeight:600}}>-{fmt(dayExp)}</p>}
                      {dayItems.length>2&&<p style={{fontSize:10,color:THEME.textMuted}}>+{dayItems.length-2} more</p>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:16}}>
              {[
                {label:"Income",      value:fmt(Object.values(calItems).flat().filter(e=>e.type==="inc").reduce((a,e)=>a+e.amount,0)), color:THEME.incomeColor},
                {label:"Expenses",    value:fmt(Object.values(calItems).flat().filter(e=>e.type==="exp").reduce((a,e)=>a+e.amount,0)), color:THEME.spendColor},
                {label:"Net",         value:fmt(Object.values(calItems).flat().filter(e=>e.type==="inc").reduce((a,e)=>a+e.amount,0)-Object.values(calItems).flat().filter(e=>e.type==="exp").reduce((a,e)=>a+e.amount,0)), color:THEME.accent},
                {label:"Active Days", value:Object.keys(calItems).length, color:"#7c3aed"},
              ].map((s,i)=>(
                <div key={i} className="card" style={{padding:"14px 18px"}}>
                  <p style={{fontSize:11,color:THEME.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600}}>{s.label}</p>
                  <p style={{fontSize:22,fontWeight:700,color:s.color,fontFamily:THEME.fontHeading}}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

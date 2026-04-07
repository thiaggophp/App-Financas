const fs=require("fs"),path=require("path");
function w(f,c){const d=path.dirname(f);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});fs.writeFileSync(f,c.trimStart());console.log("✅ "+f)}

// ─── DASHBOARD ───
w("src/pages/Dashboard.jsx",`import{useState,useEffect,useMemo}from"react";
import{getEntries,getGoals,getGroups,getMembers}from"../db";
import Card from"../components/Card";

const MONTHS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}

export default function Dashboard({user}){
  const[entries,setEntries]=useState([]);const[goals,setGoals]=useState([]);
  const[groups,setGroups]=useState([]);const[members,setMembers]=useState([]);
  const now=new Date();const[month,setMonth]=useState(now.getMonth());const[year,setYear]=useState(now.getFullYear());

  useEffect(()=>{
    (async()=>{
      setEntries(await getEntries(user.email));setGoals(await getGoals(user.email));
      setGroups(await getGroups(user.email));setMembers(await getMembers(user.email));
    })();
  },[user.email]);

  const monthKey=year+"-"+String(month+1).padStart(2,"0");
  const monthEntries=entries.filter(e=>e.month===monthKey);
  const receitas=monthEntries.filter(e=>e.type==="receita").reduce((s,e)=>s+e.value,0);
  const despesas=monthEntries.filter(e=>e.type==="despesa").reduce((s,e)=>s+e.value,0);
  const saldo=receitas-despesas;

  const prevM=()=>{if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1)};
  const nextM=()=>{if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1)};

  const topCats=useMemo(()=>{
    const map={};monthEntries.filter(e=>e.type==="despesa").forEach(e=>{map[e.category]=(map[e.category]||0)+e.value});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  },[monthEntries]);

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:20}}>
      <button onClick={prevM} style={{background:"none",border:"none",color:"#7c3aed",fontSize:22,cursor:"pointer"}}>◀</button>
      <h2 style={{color:"#fff",margin:0,fontSize:18,minWidth:120,textAlign:"center"}}>{MONTHS[month]} {year}</h2>
      <button onClick={nextM} style={{background:"none",border:"none",color:"#7c3aed",fontSize:22,cursor:"pointer"}}>▶</button>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
      <Card style={{textAlign:"center",padding:12}}>
        <div style={{color:"#22c55e",fontSize:11,fontWeight:600}}>RECEITAS</div>
        <div style={{color:"#22c55e",fontSize:16,fontWeight:700}}>R$ {fmt(receitas)}</div>
      </Card>
      <Card style={{textAlign:"center",padding:12}}>
        <div style={{color:"#ef4444",fontSize:11,fontWeight:600}}>DESPESAS</div>
        <div style={{color:"#ef4444",fontSize:16,fontWeight:700}}>R$ {fmt(despesas)}</div>
      </Card>
      <Card style={{textAlign:"center",padding:12}}>
        <div style={{color:saldo>=0?"#22c55e":"#ef4444",fontSize:11,fontWeight:600}}>SALDO</div>
        <div style={{color:saldo>=0?"#22c55e":"#ef4444",fontSize:16,fontWeight:700}}>R$ {fmt(saldo)}</div>
      </Card>
    </div>

    <Card style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{color:"#888",fontSize:13}}>Grupos</span><span style={{color:"#fff",fontWeight:700}}>{groups.length}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{color:"#888",fontSize:13}}>Membros</span><span style={{color:"#fff",fontWeight:700}}>{members.length}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{color:"#888",fontSize:13}}>Lançamentos do mês</span><span style={{color:"#fff",fontWeight:700}}>{monthEntries.length}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span style={{color:"#888",fontSize:13}}>Metas ativas</span><span style={{color:"#fff",fontWeight:700}}>{goals.length}</span>
      </div>
    </Card>

    {topCats.length>0&&<Card>
      <div style={{color:"#888",fontSize:12,fontWeight:600,marginBottom:10}}>TOP DESPESAS DO MÊS</div>
      {topCats.map(([cat,val])=>{
        const pct=despesas>0?Math.round(val/despesas*100):0;
        return(<div key={cat} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:"#ccc"}}>{cat}</span><span style={{color:"#ef4444",fontWeight:600}}>R$ {fmt(val)} ({pct}%)</span>
          </div>
          <div style={{height:4,background:"#1a1a30",borderRadius:2,marginTop:3}}>
            <div style={{height:4,background:"#ef4444",borderRadius:2,width:pct+"%",transition:"width .3s"}}/>
          </div>
        </div>);
      })}
    </Card>}
  </div>);
}`);

// ─── ENTRIES ───
w("src/pages/Entries.jsx",`import{useState,useEffect}from"react";
import{getEntries,saveEntry,deleteEntry,getMembers,getGroups}from"../db";
import{Btn,Input,Select}from"../components/FormElements";
import Modal from"../components/Modal";import Card from"../components/Card";

const CATS={receita:["Salário","Freelance","Aluguel","Investimento","Outros"],despesa:["Moradia","Alimentação","Transporte","Saúde","Educação","Lazer","Vestuário","Contas","Mercado","Pets","Assinaturas","Outros"]};
const ICONS={"Salário":"💼","Freelance":"💻","Aluguel":"🏠","Investimento":"📈","Moradia":"🏠","Alimentação":"🍽️","Transporte":"🚗","Saúde":"💊","Educação":"📚","Lazer":"🎮","Vestuário":"👕","Contas":"💡","Mercado":"🛒","Pets":"🐾","Assinaturas":"📺","Outros":"📦"};
const MONTHS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}

export default function Entries({user}){
  const[entries,setEntries]=useState([]);const[members,setMembers]=useState([]);const[groups,setGroups]=useState([]);
  const[modal,setModal]=useState(false);const[filter,setFilter]=useState("all");
  const now=new Date();const[month,setMonth]=useState(now.getMonth());const[year,setYear]=useState(now.getFullYear());
  const[form,setForm]=useState({type:"despesa",category:"Mercado",value:"",description:"",memberId:"",date:new Date().toISOString().slice(0,10),split:false});
  const[edit,setEdit]=useState(null);

  const reload=async()=>{setEntries(await getEntries(user.email));setMembers(await getMembers(user.email));setGroups(await getGroups(user.email))};
  useEffect(()=>{reload()},[user.email]);

  const monthKey=year+"-"+String(month+1).padStart(2,"0");
  const filtered=entries.filter(e=>e.month===monthKey).filter(e=>{
    if(filter==="receita")return e.type==="receita";if(filter==="despesa")return e.type==="despesa";
    if(filter!=="all"){return e.memberId===filter}return true;
  }).sort((a,b)=>b.date.localeCompare(a.date));

  const openNew=()=>{setEdit(null);setForm({type:"despesa",category:"Mercado",value:"",description:"",memberId:members[0]?.id||"",date:new Date().toISOString().slice(0,10),split:false});setModal(true)};
  const openEdit=(e)=>{setEdit(e);setForm({...e,value:String(e.value)});setModal(true)};

  const save=async()=>{
    if(!form.value||!form.category)return;const val=parseFloat(form.value);if(isNaN(val)||val<=0)return;
    const base={...form,value:val,ownerEmail:user.email,month:form.date.slice(0,7)};
    if(form.split&&members.length>=2){
      const half=Math.round(val/2*100)/100;
      for(let i=0;i<2&&i<members.length;i++){
        const e={...base,id:edit&&i===0?edit.id:(Date.now()+"-"+i+"-"+Math.random().toString(36).slice(2,6)),value:half,memberId:members[i].id,split:true};
        await saveEntry(e);
      }
    }else{
      base.id=edit?edit.id:Date.now()+"-"+Math.random().toString(36).slice(2,6);
      await saveEntry(base);
    }
    setModal(false);await reload();
  };

  const remove=async(id)=>{await deleteEntry(id);await reload()};
  const prevM=()=>{if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1)};
  const nextM=()=>{if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1)};
  const getMemberName=(id)=>members.find(m=>m.id===id)?.name||"—";

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <h2 style={{color:"#fff",margin:0,fontSize:20}}>Lançamentos</h2>
      <Btn onClick={openNew} style={{width:"auto",padding:"8px 16px",fontSize:13}}>+ Novo</Btn>
    </div>

    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:12}}>
      <button onClick={prevM} style={{background:"none",border:"none",color:"#7c3aed",fontSize:18,cursor:"pointer"}}>◀</button>
      <span style={{color:"#fff",fontSize:15,fontWeight:600,minWidth:100,textAlign:"center"}}>{MONTHS[month]} {year}</span>
      <button onClick={nextM} style={{background:"none",border:"none",color:"#7c3aed",fontSize:18,cursor:"pointer"}}>▶</button>
    </div>

    <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
      {[{id:"all",label:"Todos"},{id:"receita",label:"Receitas"},{id:"despesa",label:"Despesas"},...members.map(m=>({id:m.id,label:m.name}))].map(f2=>
        <button key={f2.id} onClick={()=>setFilter(f2.id)} style={{padding:"6px 12px",borderRadius:10,border:"none",background:filter===f2.id?"#7c3aed":"#1a1a30",color:filter===f2.id?"#fff":"#888",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{f2.label}</button>
      )}
    </div>

    {filtered.map(e=><Card key={e.id} onClick={()=>openEdit(e)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:20}}>{ICONS[e.category]||"📦"}</span>
          <div>
            <div style={{color:"#fff",fontWeight:600,fontSize:14}}>{e.category}</div>
            <div style={{color:"#666",fontSize:11}}>{e.description||"—"} • {getMemberName(e.memberId)}{e.split?" (50/50)":""}</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:e.type==="receita"?"#22c55e":"#ef4444",fontWeight:700,fontSize:14}}>{e.type==="receita"?"+":"-"}R$ {fmt(e.value)}</div>
          <div style={{color:"#555",fontSize:10}}>{new Date(e.date+"T12:00").toLocaleDateString("pt-BR")}</div>
        </div>
      </div>
    </Card>)}
    {filtered.length===0&&<p style={{color:"#666",textAlign:"center",marginTop:30}}>Nenhum lançamento</p>}

    <Modal open={modal} onClose={()=>setModal(false)} title={edit?"Editar":"Novo Lançamento"}>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {["despesa","receita"].map(t=><button key={t} onClick={()=>setForm({...form,type:t,category:CATS[t][0]})}
          style={{flex:1,padding:10,borderRadius:12,border:"none",background:form.type===t?(t==="receita"?"#22c55e":"#ef4444"):"#1a1a30",color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer"}}>{t==="receita"?"Receita":"Despesa"}</button>)}
      </div>
      <Select label="Categoria" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} options={CATS[form.type].map(c=>({value:c,label:(ICONS[c]||"")+" "+c}))}/>
      <Input label="Valor (R$)" type="number" value={form.value} onChange={e=>setForm({...form,value:e.target.value})} placeholder="0,00" inputMode="decimal"/>
      <Input label="Descrição" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Opcional"/>
      {members.length>0&&<Select label="Membro" value={form.memberId} onChange={e=>setForm({...form,memberId:e.target.value})} options={members.map(m=>({value:m.id,label:m.name}))}/>}
      <Input label="Data" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
      {members.length>=2&&<label style={{display:"flex",alignItems:"center",gap:8,color:"#888",fontSize:13,marginBottom:14,cursor:"pointer"}}>
        <input type="checkbox" checked={form.split||false} onChange={e=>setForm({...form,split:e.target.checked})}/> Dividir 50/50
      </label>}
      <div style={{display:"flex",gap:8}}>
        {edit&&<Btn onClick={()=>{remove(edit.id);setModal(false)}} color="#ef4444" style={{flex:1}}>Excluir</Btn>}
        <Btn onClick={save} style={{flex:1}}>Salvar</Btn>
      </div>
    </Modal>
  </div>);
}`);

// ─── GOALS ───
w("src/pages/Goals.jsx",`import{useState,useEffect}from"react";
import{getGoals,saveGoal,deleteGoal}from"../db";
import{Btn,Input}from"../components/FormElements";
import Modal from"../components/Modal";import Card from"../components/Card";

function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}

export default function Goals({user}){
  const[goals,setGoals]=useState([]);const[modal,setModal]=useState(false);
  const[form,setForm]=useState({name:"",target:"",saved:0});const[edit,setEdit]=useState(null);

  const reload=async()=>setGoals(await getGoals(user.email));
  useEffect(()=>{reload()},[user.email]);

  const openNew=()=>{setEdit(null);setForm({name:"",target:"",saved:0});setModal(true)};
  const save=async()=>{
    if(!form.name||!form.target)return;
    const g={id:edit?edit.id:Date.now()+"-"+Math.random().toString(36).slice(2,6),ownerEmail:user.email,name:form.name,target:parseFloat(form.target)||0,saved:parseFloat(form.saved)||0};
    await saveGoal(g);setModal(false);await reload();
  };
  const addAmount=async(g,amt)=>{g.saved=(g.saved||0)+amt;await saveGoal(g);await reload()};
  const remove=async(id)=>{await deleteGoal(id);await reload()};

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{color:"#fff",margin:0,fontSize:20}}>Metas</h2>
      <Btn onClick={openNew} style={{width:"auto",padding:"8px 16px",fontSize:13}}>+ Nova Meta</Btn>
    </div>

    {goals.map(g=>{const pct=g.target>0?Math.min(100,Math.round(g.saved/g.target*100)):0;
      return(<Card key={g.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{color:"#fff",fontWeight:600,fontSize:15}}>🎯 {g.name}</span>
          <button onClick={()=>remove(g.id)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:14}}>🗑</button>
        </div>
        <div style={{color:"#888",fontSize:12,marginBottom:6}}>R$ {fmt(g.saved)} de R$ {fmt(g.target)} ({pct}%)</div>
        <div style={{height:6,background:"#1a1a30",borderRadius:3,marginBottom:8}}>
          <div style={{height:6,background:pct>=100?"#22c55e":"#7c3aed",borderRadius:3,width:pct+"%",transition:"width .3s"}}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[50,100,200].map(v=><button key={v} onClick={()=>addAmount(g,v)} style={{flex:1,padding:"6px 0",borderRadius:8,border:"none",background:"#1a1a30",color:"#7c3aed",fontSize:12,fontWeight:600,cursor:"pointer"}}>+R\${v}</button>)}
        </div>
      </Card>);
    })}
    {goals.length===0&&<p style={{color:"#666",textAlign:"center",marginTop:30}}>Nenhuma meta criada</p>}

    <Modal open={modal} onClose={()=>setModal(false)} title="Nova Meta">
      <Input label="Nome da meta" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex: Viagem, Reserva..."/>
      <Input label="Valor alvo (R$)" type="number" value={form.target} onChange={e=>setForm({...form,target:e.target.value})} placeholder="0,00"/>
      <Btn onClick={save}>Criar Meta</Btn>
    </Modal>
  </div>);
}`);

// ─── REPORTS ───
w("src/pages/Reports.jsx",`import{useState,useEffect,useMemo}from"react";
import{getEntries}from"../db";import Card from"../components/Card";

const MONTHS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}

export default function Reports({user}){
  const[entries,setEntries]=useState([]);const[year,setYear]=useState(new Date().getFullYear());
  useEffect(()=>{(async()=>setEntries(await getEntries(user.email)))()},[user.email]);

  const data=useMemo(()=>MONTHS.map((_,i)=>{
    const mk=year+"-"+String(i+1).padStart(2,"0");
    const me=entries.filter(e=>e.month===mk);
    return{m:MONTHS[i],r:me.filter(e=>e.type==="receita").reduce((s,e)=>s+e.value,0),d:me.filter(e=>e.type==="despesa").reduce((s,e)=>s+e.value,0)};
  }),[entries,year]);

  const max=Math.max(...data.map(d=>Math.max(d.r,d.d)),1);
  const totalR=data.reduce((s,d)=>s+d.r,0);const totalD=data.reduce((s,d)=>s+d.d,0);

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:20}}>
      <button onClick={()=>setYear(y=>y-1)} style={{background:"none",border:"none",color:"#7c3aed",fontSize:22,cursor:"pointer"}}>◀</button>
      <h2 style={{color:"#fff",margin:0,fontSize:20}}>{year}</h2>
      <button onClick={()=>setYear(y=>y+1)} style={{background:"none",border:"none",color:"#7c3aed",fontSize:22,cursor:"pointer"}}>▶</button>
    </div>

    <Card style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-around",textAlign:"center"}}>
        <div><div style={{color:"#22c55e",fontSize:11,fontWeight:600}}>RECEITAS</div><div style={{color:"#22c55e",fontSize:16,fontWeight:700}}>R$ {fmt(totalR)}</div></div>
        <div><div style={{color:"#ef4444",fontSize:11,fontWeight:600}}>DESPESAS</div><div style={{color:"#ef4444",fontSize:16,fontWeight:700}}>R$ {fmt(totalD)}</div></div>
        <div><div style={{color:totalR-totalD>=0?"#22c55e":"#ef4444",fontSize:11,fontWeight:600}}>SALDO</div><div style={{color:totalR-totalD>=0?"#22c55e":"#ef4444",fontSize:16,fontWeight:700}}>R$ {fmt(totalR-totalD)}</div></div>
      </div>
    </Card>

    <Card>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",height:180,gap:2}}>
        {data.map((d,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <div style={{display:"flex",gap:1,alignItems:"flex-end",height:140,width:"100%"}}>
            <div style={{flex:1,background:"#22c55e",borderRadius:"3px 3px 0 0",height:Math.max(2,d.r/max*140),transition:"height .3s"}}/>
            <div style={{flex:1,background:"#ef4444",borderRadius:"3px 3px 0 0",height:Math.max(2,d.d/max*140),transition:"height .3s"}}/>
          </div>
          <div style={{color:"#666",fontSize:9,marginTop:2}}>{d.m}</div>
        </div>)}
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:10}}>
        <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#888"}}><span style={{width:8,height:8,borderRadius:2,background:"#22c55e",display:"inline-block"}}/>Receitas</span>
        <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#888"}}><span style={{width:8,height:8,borderRadius:2,background:"#ef4444",display:"inline-block"}}/>Despesas</span>
      </div>
    </Card>
  </div>);
}`);

console.log("\\n✅ s3.cjs concluído! Agora rode: node s4.cjs\\n");
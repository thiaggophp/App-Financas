import{useState,useEffect,useMemo}from"react";
import{getEntries,getGoals,getGroups,getMembers}from"../db";
import Card from"../components/Card";

const MONTHS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}
const ICONS={"Salário":"💼","Freelance":"💻","Aluguel":"🏠","Investimento":"📈","Moradia":"🏠","Alimentação":"🍽️","Transporte":"🚗","Saúde":"💊","Educação":"📚","Lazer":"🎮","Vestuário":"👕","Contas":"💡","Mercado":"🛒","Pets":"🐾","Assinaturas":"📺","Outros":"📦"};

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
  const monthEntries=entries.filter(e=>e.date&&e.date.startsWith(monthKey));
  const receitas=monthEntries.filter(e=>e.type==="receita").reduce((s,e)=>s+e.value,0);
  const despesas=monthEntries.filter(e=>e.type==="despesa").reduce((s,e)=>s+e.value,0);
  const saldo=receitas-despesas;
  const pendentes=monthEntries.filter(e=>e.type==="despesa"&&!e.isPaid);
  const totalPendente=pendentes.reduce((s,e)=>s+e.value,0);

  const prevM=()=>{if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1)};
  const nextM=()=>{if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1)};

  const topCats=useMemo(()=>{
    const map={};monthEntries.filter(e=>e.type==="despesa").forEach(e=>{map[e.category]=(map[e.category]||0)+e.value});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  },[monthEntries]);

  const pctGasto=receitas>0?Math.min(100,Math.round(despesas/receitas*100)):0;

  return(<div style={{padding:"0 4px 8px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:20}}>
      <button onClick={prevM} style={{background:"rgba(124,58,237,.15)",border:"none",color:"#a78bfa",fontSize:16,cursor:"pointer",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}>◀</button>
      <h2 style={{color:"#f1f5f9",margin:0,fontSize:17,fontWeight:700,minWidth:120,textAlign:"center"}}>{MONTHS[month]} {year}</h2>
      <button onClick={nextM} style={{background:"rgba(124,58,237,.15)",border:"none",color:"#a78bfa",fontSize:16,cursor:"pointer",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}>▶</button>
    </div>

    <div style={{background:"linear-gradient(135deg,#1e1040,#2d1b69)",borderRadius:20,padding:"20px",marginBottom:12,border:"1px solid rgba(124,58,237,.25)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(124,58,237,.15)"}}/>
      <div style={{color:"#a78bfa",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:4}}>SALDO DO MÊS</div>
      <div style={{color:saldo>=0?"#f1f5f9":"#ef4444",fontSize:28,fontWeight:800,letterSpacing:-.5}}>R$ {fmt(saldo)}</div>
      <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:2,marginTop:14,marginBottom:4}}>
        <div style={{height:4,background:pctGasto>=100?"#ef4444":"#7c3aed",borderRadius:2,width:pctGasto+"%",transition:"width .5s ease"}}/>
      </div>
      <div style={{color:"#64748b",fontSize:11}}>{pctGasto}% das receitas gastas</div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
      <div style={{background:"rgba(34,197,94,.08)",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(34,197,94,.15)"}}>
        <div style={{color:"#86efac",fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:4}}>RECEITAS</div>
        <div style={{color:"#22c55e",fontSize:18,fontWeight:800}}>R$ {fmt(receitas)}</div>
      </div>
      <div style={{background:"rgba(239,68,68,.08)",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(239,68,68,.15)"}}>
        <div style={{color:"#fca5a5",fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:4}}>DESPESAS</div>
        <div style={{color:"#ef4444",fontSize:18,fontWeight:800}}>R$ {fmt(despesas)}</div>
      </div>
    </div>

    {totalPendente>0&&<div style={{background:"rgba(245,158,11,.08)",borderRadius:14,padding:"12px 16px",marginBottom:12,border:"1px solid rgba(245,158,11,.2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{color:"#fbbf24",fontSize:11,fontWeight:700}}>⏳ A QUITAR</div>
        <div style={{color:"#64748b",fontSize:11,marginTop:2}}>{pendentes.length} despesa{pendentes.length!==1?"s":""} pendente{pendentes.length!==1?"s":""}</div>
      </div>
      <div style={{color:"#f59e0b",fontWeight:800,fontSize:16}}>R$ {fmt(totalPendente)}</div>
    </div>}

    <Card style={{marginBottom:12}}>
      <div style={{color:"#64748b",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:12}}>RESUMO</div>
      {[["Grupos",groups.length],["Membros",members.length],["Lançamentos",monthEntries.length],["Metas ativas",goals.length]].map(([k,v])=>
        <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{color:"#94a3b8",fontSize:13}}>{k}</span>
          <span style={{color:"#f1f5f9",fontWeight:700,fontSize:14}}>{v}</span>
        </div>
      )}
    </Card>

    {topCats.length>0&&<Card>
      <div style={{color:"#64748b",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:14}}>TOP DESPESAS</div>
      {topCats.map(([cat,val])=>{
        const pct=despesas>0?Math.round(val/despesas*100):0;
        return(<div key={cat} style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
            <span style={{color:"#cbd5e1",display:"flex",alignItems:"center",gap:6}}><span>{ICONS[cat]||"📦"}</span>{cat}</span>
            <span style={{color:"#ef4444",fontWeight:700}}>R$ {fmt(val)} <span style={{color:"#475569",fontWeight:400}}>({pct}%)</span></span>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
            <div style={{height:4,background:"linear-gradient(90deg,#ef4444,#f97316)",borderRadius:2,width:pct+"%",transition:"width .4s ease"}}/>
          </div>
        </div>);
      })}
    </Card>}
  </div>);
}

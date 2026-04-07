import{useState,useEffect,useMemo}from"react";
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
}
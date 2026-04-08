import{useState,useEffect,useMemo}from"react";
import{getEntries}from"../db";import Card from"../components/Card";

const MONTHS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}

export default function Reports({user}){
  const[entries,setEntries]=useState([]);const[year,setYear]=useState(new Date().getFullYear());
  useEffect(()=>{(async()=>setEntries(await getEntries(user.email)))()},[user.email]);

  const data=useMemo(()=>MONTHS.map((_,i)=>{
    const mk=year+"-"+String(i+1).padStart(2,"0");
    const me=entries.filter(e=>e.date&&e.date.startsWith(mk));
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
}
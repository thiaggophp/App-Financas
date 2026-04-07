import{useState,useEffect}from"react";
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
    const g={ownerEmail:user.email,name:form.name,target:parseFloat(form.target)||0,saved:parseFloat(form.saved)||0};if(edit)g.id=edit.id;
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
          {[50,100,200].map(v=><button key={v} onClick={()=>addAmount(g,v)} style={{flex:1,padding:"6px 0",borderRadius:8,border:"none",background:"#1a1a30",color:"#7c3aed",fontSize:12,fontWeight:600,cursor:"pointer"}}>+R${v}</button>)}
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
}
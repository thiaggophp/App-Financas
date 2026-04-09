import{useState,useEffect}from"react";
import{getGoals,saveGoal,deleteGoal}from"../db";
import{Btn,Input,InputMoney}from"../components/FormElements";
import Modal from"../components/Modal";

function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}

export default function Goals({user}){
  const[goals,setGoals]=useState([]);const[modal,setModal]=useState(false);
  const[form,setForm]=useState({name:"",target:"",saved:0});const[edit,setEdit]=useState(null);
  const[addModal,setAddModal]=useState(null);const[addValue,setAddValue]=useState("");
  const[deleteConfirm,setDeleteConfirm]=useState(null);

  const reload=async()=>setGoals(await getGoals(user.email));
  useEffect(()=>{reload()},[user.email]);

  const openNew=()=>{setEdit(null);setForm({name:"",target:"",saved:0});setModal(true)};
  const openEdit=(g)=>{setEdit(g);setForm({name:g.name,target:String(g.target),saved:g.saved});setModal(true)};

  const save=async()=>{
    if(!form.name||!form.target)return;
    const g={ownerEmail:user.email,name:form.name,target:parseFloat(form.target)||0,saved:parseFloat(form.saved)||0};
    if(edit)g.id=edit.id;
    await saveGoal(g);setModal(false);await reload();
  };

  const addAmount=async()=>{
    const v=parseFloat(addValue);if(isNaN(v)||v<=0)return;
    const g={...addModal,saved:(addModal.saved||0)+v};
    await saveGoal(g);setAddModal(null);setAddValue("");await reload();
  };

  const remove=async(id)=>{await deleteGoal(id);await reload()};

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{color:"#f1f5f9",margin:0,fontSize:20,fontWeight:700}}>Metas</h2>
      <button onClick={openNew} style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Nova</button>
    </div>

    {goals.map(g=>{
      const pct=g.target>0?Math.min(100,Math.round(g.saved/g.target*100)):0;
      const done=pct>=100;
      return(<div key={g.id} style={{background:"#111127",borderRadius:18,padding:"16px",marginBottom:10,border:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div style={{cursor:"pointer",flex:1}} onClick={()=>openEdit(g)}>
            <div style={{color:"#f1f5f9",fontWeight:700,fontSize:15,display:"flex",alignItems:"center",gap:6}}>
              {done?"🏆":"🎯"} {g.name}
              {done&&<span style={{background:"rgba(34,197,94,.15)",color:"#22c55e",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,border:"1px solid rgba(34,197,94,.2)"}}>Concluída</span>}
            </div>
            <div style={{color:"#64748b",fontSize:12,marginTop:3}}>R$ {fmt(g.saved)} de R$ {fmt(g.target)}</div>
          </div>
          <button onClick={()=>setDeleteConfirm(g)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:16,padding:"0 4px"}}>✕</button>
        </div>

        <div style={{position:"relative",height:8,background:"rgba(255,255,255,0.06)",borderRadius:4,marginBottom:12,overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,height:"100%",background:done?"linear-gradient(90deg,#22c55e,#16a34a)":"linear-gradient(90deg,#7c3aed,#a78bfa)",borderRadius:4,width:pct+"%",transition:"width .4s ease"}}/>
        </div>

        <div style={{display:"flex",gap:6}}>
          {[50,100,200,500].map(v=><button key={v} onClick={()=>{setAddModal(g);setAddValue(String(v))}}
            style={{flex:1,padding:"7px 0",borderRadius:10,border:"1px solid rgba(124,58,237,.25)",background:"rgba(124,58,237,.08)",color:"#a78bfa",fontSize:12,fontWeight:700,cursor:"pointer"}}>+{v}</button>)}
          <button onClick={()=>{setAddModal(g);setAddValue("")}}
            style={{flex:1,padding:"7px 0",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#94a3b8",fontSize:12,fontWeight:700,cursor:"pointer"}}>outro</button>
        </div>
      </div>);
    })}
    {goals.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#475569"}}>
      <div style={{fontSize:36,marginBottom:10}}>🎯</div>
      <div style={{fontSize:14}}>Nenhuma meta criada</div>
    </div>}

    <Modal open={modal} onClose={()=>setModal(false)} title={edit?"Editar Meta":"Nova Meta"}>
      <Input label="Nome da meta" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex: Viagem, Reserva..."/>
      <InputMoney label="Valor alvo (R$)" value={form.target} onChange={e=>setForm({...form,target:e.target.value})} placeholder="0,00"/>
      {edit&&<InputMoney label="Valor já guardado (R$)" value={String(form.saved)} onChange={e=>setForm({...form,saved:e.target.value})} placeholder="0,00"/>}
      <Btn onClick={save}>{edit?"Salvar Alterações":"Criar Meta"}</Btn>
    </Modal>

    <Modal open={!!addModal} onClose={()=>setAddModal(null)} title="Adicionar valor">
      {addModal&&<>
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between"}}>
          <span style={{color:"#94a3b8",fontSize:14}}>{addModal.name}</span>
          <span style={{color:"#a78bfa",fontWeight:700}}>R$ {fmt(addModal.saved)} / {fmt(addModal.target)}</span>
        </div>
        <InputMoney label="Valor a adicionar (R$)" value={addValue} onChange={e=>setAddValue(e.target.value)} placeholder="0,00"/>
        <Btn onClick={addAmount} color="linear-gradient(135deg,#22c55e,#16a34a)">Adicionar</Btn>
      </>}
    </Modal>

    <Modal open={!!deleteConfirm} onClose={()=>setDeleteConfirm(null)} title="Excluir meta">
      {deleteConfirm&&<>
        <p style={{color:"#94a3b8",fontSize:14,marginBottom:20,textAlign:"center"}}>Deseja excluir a meta "{deleteConfirm.name}"?</p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setDeleteConfirm(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={()=>{remove(deleteConfirm.id);setDeleteConfirm(null)}} color="linear-gradient(135deg,#ef4444,#dc2626)" style={{flex:1}}>Excluir</Btn>
        </div>
      </>}
    </Modal>
  </div>);
}

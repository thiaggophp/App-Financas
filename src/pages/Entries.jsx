import{useState,useEffect}from"react";
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
        const e={...base,value:half,memberId:members[i].id,split:true};if(edit&&i===0)e.id=edit.id;
        await saveEntry(e);
      }
    }else{
      if(edit)base.id=edit.id;
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
}
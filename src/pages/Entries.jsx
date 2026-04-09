import{useState,useEffect}from"react";
import{getEntries,saveEntry,deleteEntry,getMembers,getGroups,getMemberByEmail}from"../db";
import{Btn,Input,Select}from"../components/FormElements";
import Modal from"../components/Modal";import Card from"../components/Card";

const CATS={receita:["Salário","Freelance","Aluguel","Investimento","Outros"],despesa:["Moradia","Alimentação","Transporte","Saúde","Educação","Lazer","Vestuário","Contas","Mercado","Pets","Assinaturas","Outros"]};
const ICONS={"Salário":"💼","Freelance":"💻","Aluguel":"🏠","Investimento":"📈","Moradia":"🏠","Alimentação":"🍽️","Transporte":"🚗","Saúde":"💊","Educação":"📚","Lazer":"🎮","Vestuário":"👕","Contas":"💡","Mercado":"🛒","Pets":"🐾","Assinaturas":"📺","Outros":"📦"};
const MONTHS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}
function fmtDate(s){if(!s)return"";const[y,m,d]=s.split("-");return`${d}/${m}/${y}`}
const TODAY=new Date().toISOString().slice(0,10);

export default function Entries({user}){
  const isSubUser=!!user.parentEmail;
  const ownerEmail=user.parentEmail||user.email;
  const[entries,setEntries]=useState([]);const[members,setMembers]=useState([]);
  const[groups,setGroups]=useState([]);const[myGroupId,setMyGroupId]=useState("");
  const[modal,setModal]=useState(false);const[filter,setFilter]=useState("all");
  const[budgetModal,setBudgetModal]=useState(false);
  const[budgets,setBudgets]=useState(()=>{try{return JSON.parse(localStorage.getItem("financas_budgets")||"{}")}catch{return{}}});
  const[budgetForm,setBudgetForm]=useState({});
  const now=new Date();const[month,setMonth]=useState(now.getMonth());const[year,setYear]=useState(now.getFullYear());
  const[busca,setBusca]=useState("");
  const[form,setForm]=useState({type:"despesa",category:"Mercado",value:"",description:"",memberId:"",groupId:"",date:TODAY,split:false,recorrente:false});
  const[edit,setEdit]=useState(null);
  const[quitarEntry,setQuitarEntry]=useState(null);const[paidDate,setPaidDate]=useState(TODAY);
  const[deleteConfirm,setDeleteConfirm]=useState(null);

  const reload=async()=>{
    const gs=await getGroups(ownerEmail);setGroups(gs);
    const ms=await getMembers(ownerEmail);setMembers(ms);
    if(isSubUser){
      const memberRec=await getMemberByEmail(user.email);
      const gid=memberRec?.groupId||"";setMyGroupId(gid);
      setEntries(await getEntries(ownerEmail,gid));
    }else{
      setEntries(await getEntries(ownerEmail));
    }
  };
  useEffect(()=>{reload()},[user.email]);

  const monthKey=year+"-"+String(month+1).padStart(2,"0");
  const filtered=entries.filter(e=>e.date&&e.date.startsWith(monthKey)).filter(e=>{
    if(filter==="receita")return e.type==="receita";
    if(filter==="despesa")return e.type==="despesa";
    if(filter==="pendente")return e.type==="despesa"&&!e.isPaid;
    if(filter==="quitada")return e.type==="despesa"&&e.isPaid;
    if(filter!=="all")return e.memberId===filter;
    return true;
  }).filter(e=>!busca||e.description?.toLowerCase().includes(busca.toLowerCase())||e.category?.toLowerCase().includes(busca.toLowerCase()))
  .sort((a,b)=>b.date.localeCompare(a.date));

  const recorrentesAntMes=(()=>{
    const antMonth=month===0?11:month-1;const antYear=month===0?year-1:year;
    const antKey=antYear+"-"+String(antMonth+1).padStart(2,"0");
    return entries.filter(e=>e.recorrente&&e.date&&e.date.startsWith(antKey));
  })();
  const temRecorrentesNaoCopiados=recorrentesAntMes.length>0&&!entries.some(e=>e.recorrente&&e.date&&e.date.startsWith(monthKey));

  const copiarRecorrentes=async()=>{
    for(const e of recorrentesAntMes){
      const nova={...e,id:undefined,date:monthKey+"-"+e.date.slice(8,10),isPaid:false,paidAt:""};
      await saveEntry(nova);
    }
    await reload();
  };

  const salvarBudgets=()=>{
    const b={};Object.entries(budgetForm).forEach(([k,v])=>{const n=parseFloat(v);if(n>0)b[k]=n;});
    setBudgets(b);localStorage.setItem("financas_budgets",JSON.stringify(b));setBudgetModal(false);
  };

  const exportarCSV=()=>{
    const header="Data,Tipo,Categoria,Descrição,Membro,Valor,Status\n";
    const rows=filtered.map(e=>{
      const mem=getMemberName(e.memberId);
      return[fmtDate(e.date),e.type,e.category,`"${e.description||""}"`,mem||"",e.value.toFixed(2),e.isPaid?"Pago":"Pendente"].join(",");
    }).join("\n");
    const blob=new Blob(["\uFEFF"+header+rows],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download=`extrato-${monthKey}.csv`;a.click();URL.revokeObjectURL(url);
  };

  const totReceita=filtered.filter(e=>e.type==="receita").reduce((s,e)=>s+e.value,0);
  const totDespesa=filtered.filter(e=>e.type==="despesa").reduce((s,e)=>s+e.value,0);

  const openNew=()=>{setEdit(null);setForm({type:"despesa",category:"Mercado",value:"",description:"",memberId:members[0]?.id||"",groupId:myGroupId||groups[0]?.id||"",date:TODAY,split:false,recorrente:false});setModal(true)};
  const openEdit=(e)=>{setEdit(e);setForm({...e,value:String(e.value)});setModal(true)};

  const save=async()=>{
    if(!form.value||!form.category)return;const val=parseFloat(form.value);if(isNaN(val)||val<=0)return;
    const base={...form,value:val,ownerEmail};
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

  const confirmQuitar=async()=>{
    const updated={...quitarEntry,isPaid:true,paidAt:paidDate};
    await saveEntry(updated);setQuitarEntry(null);await reload();
  };
  const desfazerQuitar=async(e)=>{
    const updated={...e,isPaid:false,paidAt:""};
    await saveEntry(updated);await reload();
  };

  const remove=async(id)=>{await deleteEntry(id);await reload()};
  const prevM=()=>{if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1)};
  const nextM=()=>{if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1)};
  const getMemberName=(id)=>members.find(m=>m.id===id)?.name||"";

  const FILTERS=[{id:"all",label:"Todos"},{id:"receita",label:"Receitas"},{id:"despesa",label:"Despesas"},{id:"pendente",label:"Pendentes"},{id:"quitada",label:"Quitadas"},...members.map(m=>({id:m.id,label:m.name}))];

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{color:"#f1f5f9",margin:0,fontSize:20,fontWeight:700}}>Lançamentos</h2>
      <div style={{display:"flex",gap:8}}>
        <button onClick={exportarCSV} style={{background:"rgba(124,58,237,.1)",border:"1px solid rgba(124,58,237,.25)",borderRadius:12,padding:"8px 12px",color:"#a78bfa",fontSize:13,fontWeight:700,cursor:"pointer"}}>📥 CSV</button>
        <button onClick={openNew} style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Novo</button>
      </div>
    </div>

    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:16}}>
      <button onClick={prevM} style={{background:"rgba(124,58,237,.15)",border:"none",color:"#a78bfa",fontSize:16,cursor:"pointer",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}>◀</button>
      <span style={{color:"#f1f5f9",fontSize:16,fontWeight:700,minWidth:110,textAlign:"center"}}>{MONTHS[month]} {year}</span>
      <button onClick={nextM} style={{background:"rgba(124,58,237,.15)",border:"none",color:"#a78bfa",fontSize:16,cursor:"pointer",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}>▶</button>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      <div style={{background:"rgba(34,197,94,.08)",borderRadius:14,padding:"10px 14px",border:"1px solid rgba(34,197,94,.15)"}}>
        <div style={{color:"#86efac",fontSize:10,fontWeight:700,letterSpacing:.8}}>RECEITAS</div>
        <div style={{color:"#22c55e",fontSize:17,fontWeight:800}}>R$ {fmt(totReceita)}</div>
      </div>
      <div style={{background:"rgba(239,68,68,.08)",borderRadius:14,padding:"10px 14px",border:"1px solid rgba(239,68,68,.15)"}}>
        <div style={{color:"#fca5a5",fontSize:10,fontWeight:700,letterSpacing:.8}}>DESPESAS</div>
        <div style={{color:"#ef4444",fontSize:17,fontWeight:800}}>R$ {fmt(totDespesa)}</div>
      </div>
    </div>

    {Object.keys(budgets).length>0&&<div style={{background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.15)",borderRadius:14,padding:"12px 14px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{color:"#a78bfa",fontSize:11,fontWeight:700,letterSpacing:.8}}>ORÇAMENTO MENSAL</span>
        <button onClick={()=>{setBudgetForm({...budgets});setBudgetModal(true)}} style={{background:"none",border:"none",color:"#7c3aed",fontSize:11,cursor:"pointer",fontWeight:600}}>editar</button>
      </div>
      {CATS.despesa.filter(c=>budgets[c]).map(c=>{
        const gasto=entries.filter(e=>e.date&&e.date.startsWith(monthKey)&&e.type==="despesa"&&e.category===c).reduce((s,e)=>s+e.value,0);
        const pct=Math.min(100,Math.round((gasto/budgets[c])*100));
        return(<div key={c} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{color:"#94a3b8",fontSize:12}}>{ICONS[c]||""} {c}</span>
            <span style={{color:pct>=100?"#ef4444":pct>=80?"#f59e0b":"#94a3b8",fontSize:12,fontWeight:600}}>R$ {fmt(gasto)} / {fmt(budgets[c])}</span>
          </div>
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:4,height:5,overflow:"hidden"}}>
            <div style={{background:pct>=100?"#ef4444":pct>=80?"#f59e0b":"#7c3aed",height:"100%",width:pct+"%",borderRadius:4,transition:"width .4s"}}/>
          </div>
        </div>);
      })}
    </div>}
    {!Object.keys(budgets).length&&<button onClick={()=>{setBudgetForm({});setBudgetModal(true)}} style={{width:"100%",background:"rgba(124,58,237,.06)",border:"1px dashed rgba(124,58,237,.25)",borderRadius:12,padding:"8px",color:"#7c3aed",fontSize:12,fontWeight:600,cursor:"pointer",marginBottom:10}}>📊 Definir orçamento por categoria</button>}

    <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto",paddingBottom:4}}>
      {FILTERS.map(f2=><button key={f2.id} onClick={()=>setFilter(f2.id)} style={{padding:"6px 14px",borderRadius:20,border:"none",background:filter===f2.id?"#7c3aed":"rgba(255,255,255,0.05)",color:filter===f2.id?"#fff":"#94a3b8",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}}>{f2.label}</button>)}
    </div>
    <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Buscar por descrição ou categoria..." style={{width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#f1f5f9",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:10,colorScheme:"dark"}}/>
    {temRecorrentesNaoCopiados&&<div style={{background:"rgba(124,58,237,.1)",border:"1px solid rgba(124,58,237,.25)",borderRadius:12,padding:"10px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{color:"#c4b5fd",fontSize:13}}>🔁 {recorrentesAntMes.length} lançamento(s) recorrente(s) do mês anterior</span>
      <button onClick={copiarRecorrentes} style={{background:"#7c3aed",border:"none",borderRadius:8,padding:"5px 12px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>Copiar</button>
    </div>}

    {filtered.map(e=>{
      const memberName=getMemberName(e.memberId);
      return(<div key={e.id} style={{background:"#111127",borderRadius:16,marginBottom:10,border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
        <div onClick={()=>openEdit(e)} style={{padding:"14px 16px",cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{display:"flex",gap:10,alignItems:"center",flex:1}}>
              <div style={{width:42,height:42,borderRadius:12,background:e.type==="receita"?"rgba(34,197,94,.12)":"rgba(239,68,68,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                {ICONS[e.category]||"📦"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{e.category}</div>
                <div style={{color:"#64748b",fontSize:11,marginTop:1}}>{e.description||"—"}{memberName?` · ${memberName}`:""}{e.split?" (50/50)":""}{e.recorrente?" 🔁":""}</div>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{color:e.type==="receita"?"#22c55e":"#ef4444",fontWeight:800,fontSize:15}}>{e.type==="receita"?"+":"-"}R$ {fmt(e.value)}</div>
              <div style={{color:"#475569",fontSize:11,marginTop:1}}>{fmtDate(e.date)}</div>
            </div>
          </div>
        </div>
        {e.type==="despesa"&&<div style={{borderTop:"1px solid rgba(255,255,255,0.04)",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          {e.isPaid
            ?<div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                <span style={{background:"rgba(34,197,94,.12)",color:"#22c55e",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,border:"1px solid rgba(34,197,94,.2)"}}>✓ Quitado · {fmtDate(e.paidAt)}</span>
                <button onClick={()=>desfazerQuitar(e)} style={{background:"none",border:"none",color:"#475569",fontSize:11,cursor:"pointer",padding:"0 4px"}}>desfazer</button>
              </div>
            :<button onClick={e2=>{e2.stopPropagation();setQuitarEntry(e);setPaidDate(TODAY)}}
                style={{background:"rgba(124,58,237,.12)",border:"1px solid rgba(124,58,237,.25)",borderRadius:8,padding:"5px 14px",color:"#a78bfa",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                Quitar
              </button>
          }
        </div>}
      </div>);
    })}
    {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#475569"}}>
      <div style={{fontSize:32,marginBottom:8}}>📋</div>
      <div style={{fontSize:14}}>Nenhum lançamento</div>
    </div>}

    <Modal open={modal} onClose={()=>setModal(false)} title={edit?"Editar Lançamento":"Novo Lançamento"}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["despesa","receita"].map(t=><button key={t} onClick={()=>setForm({...form,type:t,category:CATS[t][0]})}
          style={{flex:1,padding:"11px 0",borderRadius:12,border:"2px solid",borderColor:form.type===t?(t==="receita"?"#22c55e":"#ef4444"):"rgba(255,255,255,0.07)",background:form.type===t?(t==="receita"?"rgba(34,197,94,.12)":"rgba(239,68,68,.12)"):"transparent",color:form.type===t?(t==="receita"?"#22c55e":"#ef4444"):"#64748b",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all .15s"}}>
          {t==="receita"?"↑ Receita":"↓ Despesa"}</button>)}
      </div>
      <Select label="Categoria" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} options={CATS[form.type].map(c=>({value:c,label:(ICONS[c]||"")+" "+c}))}/>
      <Input label="Valor (R$)" type="number" value={form.value} onChange={e=>setForm({...form,value:e.target.value})} placeholder="0,00" inputMode="decimal"/>
      <Input label="Descrição" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Opcional"/>
      {members.length>0&&<Select label="Membro" value={form.memberId} onChange={e=>setForm({...form,memberId:e.target.value})} options={[{value:"",label:"— Nenhum —"},...members.map(m=>({value:m.id,label:m.name}))]}/>}
      {groups.length>0&&<Select label="Grupo" value={form.groupId} onChange={e=>setForm({...form,groupId:e.target.value})} options={[{value:"",label:"— Nenhum —"},...groups.map(g=>({value:g.id,label:g.name}))]} disabled={isSubUser}/>}
      <Input label="Data" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
      {members.length>=2&&<label style={{display:"flex",alignItems:"center",gap:8,color:"#94a3b8",fontSize:13,marginBottom:12,cursor:"pointer"}}>
        <input type="checkbox" checked={form.split||false} onChange={e=>setForm({...form,split:e.target.checked})}/> Dividir 50/50 entre membros
      </label>}
      <label style={{display:"flex",alignItems:"center",gap:8,color:"#94a3b8",fontSize:13,marginBottom:16,cursor:"pointer"}}>
        <input type="checkbox" checked={form.recorrente||false} onChange={e=>setForm({...form,recorrente:e.target.checked})}/> 🔁 Repetir todo mês (recorrente)
      </label>
      <div style={{display:"flex",gap:8}}>
        {edit&&<Btn onClick={()=>setDeleteConfirm(edit)} color="rgba(239,68,68,.15)" style={{flex:1,border:"1px solid rgba(239,68,68,.3)",color:"#ef4444"}}>Excluir</Btn>}
        <Btn onClick={save} style={{flex:edit?1:undefined}}>Salvar</Btn>
      </div>
    </Modal>

    <Modal open={!!quitarEntry} onClose={()=>setQuitarEntry(null)} title="Quitar lançamento">
      {quitarEntry&&<>
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:"#f1f5f9",fontWeight:600,fontSize:15}}>{quitarEntry.category}</div>
              {quitarEntry.description&&<div style={{color:"#64748b",fontSize:12,marginTop:2}}>{quitarEntry.description}</div>}
            </div>
            <div style={{color:"#ef4444",fontWeight:800,fontSize:17}}>R$ {fmt(quitarEntry.value)}</div>
          </div>
        </div>
        <Input label="Data de pagamento" type="date" value={paidDate} onChange={e=>setPaidDate(e.target.value)}/>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setQuitarEntry(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={confirmQuitar} color="linear-gradient(135deg,#22c55e,#16a34a)" style={{flex:1}}>Confirmar</Btn>
        </div>
      </>}
    </Modal>

    <Modal open={budgetModal} onClose={()=>setBudgetModal(false)} title="Orçamento por Categoria">
      <p style={{color:"#64748b",fontSize:12,marginBottom:14}}>Defina um limite mensal por categoria de despesa (deixe em branco para sem limite).</p>
      {CATS.despesa.map(c=><div key={c} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{color:"#94a3b8",fontSize:13,flex:1}}>{ICONS[c]||""} {c}</span>
        <input type="number" value={budgetForm[c]||""} onChange={e=>setBudgetForm(b=>({...b,[c]:e.target.value}))} placeholder="Sem limite" inputMode="decimal" style={{width:110,padding:"7px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"#f1f5f9",fontSize:13,outline:"none",colorScheme:"dark",textAlign:"right"}}/>
      </div>)}
      <Btn onClick={salvarBudgets}>Salvar Orçamentos</Btn>
    </Modal>

    <Modal open={!!deleteConfirm} onClose={()=>setDeleteConfirm(null)} title="Excluir lançamento">
      {deleteConfirm&&<>
        <p style={{color:"#94a3b8",fontSize:14,marginBottom:20,textAlign:"center"}}>Deseja excluir "{deleteConfirm.category}" de R$ {fmt(deleteConfirm.value)}?</p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setDeleteConfirm(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={()=>{remove(deleteConfirm.id);setDeleteConfirm(null);setModal(false)}} color="linear-gradient(135deg,#ef4444,#dc2626)" style={{flex:1}}>Excluir</Btn>
        </div>
      </>}
    </Modal>
  </div>);
}

import{useState,useEffect}from"react";
import{getAllAccounts,saveAccount,deleteAccount,getSignupRequests,deleteSignupRequest}from"../db";
import{sendPasswordEmail,generatePassword}from"../emailService";
import{Btn,Input}from"../components/FormElements";
import Modal from"../components/Modal";
import Card from"../components/Card";

export default function Admin({currentUser}){
  const[accounts,setAccounts]=useState([]);const[requests,setRequests]=useState([]);
  const[tab,setTab]=useState("users");const[modal,setModal]=useState(null);
  const[newName,setNewName]=useState("");const[newEmail,setNewEmail]=useState("");
  const[newPass,setNewPass]=useState("");const[msg,setMsg]=useState(null);const[loading,setLoading]=useState(false);

  // Exibe apenas contas principais (sem parentEmail)
  const load=async()=>{const all=await getAllAccounts();setAccounts(all.filter(a=>!a.parentEmail));setRequests(await getSignupRequests())};
  useEffect(()=>{load();const t=setInterval(load,30000);return()=>clearInterval(t)},[]);

  const handleCreateUser=async()=>{
    if(!newName||!newEmail){setMsg({t:"error",m:"Preencha nome e e-mail"});return}
    const e=newEmail.trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){setMsg({t:"error",m:"E-mail inválido"});return}
    if(accounts.find(a=>a.email===e)){setMsg({t:"error",m:"E-mail já cadastrado"});return}
    setLoading(true);const pass=generatePassword();
    try{
      await sendPasswordEmail(newName.trim(),e,pass);
      await saveAccount({email:e,name:newName.trim(),password:pass,role:"user",status:"active",createdAt:new Date().toISOString(),mustChangePassword:true,protected:false});
      setMsg({t:"success",m:"Usuário criado! Senha enviada para "+e});setNewName("");setNewEmail("");await load();
    }catch(err){setMsg({t:"error",m:"Erro: "+err.message})}
    setLoading(false);
  };

  const handleApproveRequest=async(req)=>{
    setLoading(true);const pass=generatePassword();
    try{
      await sendPasswordEmail(req.name,req.email,pass);
      await saveAccount({email:req.email,name:req.name,password:pass,role:"user",status:"active",createdAt:new Date().toISOString(),mustChangePassword:true,protected:false});
      await deleteSignupRequest(req.email);
      setMsg({t:"success",m:req.name+" aprovado! Senha enviada."});await load();
    }catch(err){setMsg({t:"error",m:"Erro: "+err.message})}
    setLoading(false);
  };

  const handleRejectRequest=async(req)=>{await deleteSignupRequest(req.email);await load()};

  const handleBlock=async(acc)=>{
    const allAccs=accounts.filter(a=>a.email===acc.email);
    for(const a of allAccs){a.status=a.status==="blocked"?"active":"blocked";await saveAccount(a)}
    await load();
  };

  const handleDelete=async(acc)=>{
    if(acc.protected){setMsg({t:"error",m:"Este usuário não pode ser excluído"});return}
    if(!confirm("Excluir "+acc.name+"?")){return}
    await deleteAccount(acc.email);await load();
  };

  const handleChangePassword=async()=>{
    if(!newPass||newPass.length<6){setMsg({t:"error",m:"Senha deve ter pelo menos 6 caracteres"});return}
    setLoading(true);
    try{modal.password=newPass;modal.mustChangePassword=true;await saveAccount(modal);
      setMsg({t:"success",m:"Senha alterada!"});setModal(null);setNewPass("");await load();
    }catch(err){setMsg({t:"error",m:"Erro: "+err.message})}
    setLoading(false);
  };

  const tabs=[{id:"users",label:"Usuários",icon:"👥"},{id:"requests",label:"Solicitações",icon:"📩",badge:requests.length},{id:"create",label:"Criar Usuário",icon:"➕"}];

  return(<div style={{padding:"0 4px"}}>
    <h2 style={{color:"#fff",margin:"0 0 16px",fontSize:20}}>Painel Admin</h2>

    <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
      {tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setMsg(null)}}
        style={{padding:"8px 14px",borderRadius:12,border:"none",background:tab===t.id?"#7c3aed":"#1a1a30",color:tab===t.id?"#fff":"#888",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",position:"relative",display:"flex",alignItems:"center",gap:4}}>
        {t.icon} {t.label}
        {t.badge>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700}}>{t.badge}</span>}
      </button>)}
    </div>

    {msg&&<div style={{padding:"10px 14px",borderRadius:12,marginBottom:12,fontSize:13,background:msg.t==="success"?"#22c55e15":"#ef444415",color:msg.t==="success"?"#22c55e":"#ef4444"}}>{msg.m}</div>}

    {tab==="users"&&<div>
      {accounts.map(a=><Card key={a.email}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#fff",fontWeight:600,fontSize:14}}>{a.name} {a.protected&&"🔒"} {a.role==="admin"&&<span style={{fontSize:10,background:"#7c3aed30",color:"#a78bfa",padding:"2px 6px",borderRadius:6}}>Admin</span>}</div>
            <div style={{color:"#666",fontSize:12}}>{a.email}</div>
            <div style={{fontSize:11,color:a.status==="active"?"#22c55e":"#ef4444",marginTop:2}}>{a.status==="active"?"Ativo":"Bloqueado"}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>{setModal(a);setNewPass("")}} style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:8,padding:"6px 8px",fontSize:12,color:"#7c3aed",cursor:"pointer"}}>🔑</button>
            <button onClick={()=>handleBlock(a)} style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:8,padding:"6px 8px",fontSize:12,color:a.status==="active"?"#f59e0b":"#22c55e",cursor:"pointer"}}>{a.status==="active"?"🚫":"✅"}</button>
            {!a.protected&&<button onClick={()=>handleDelete(a)} style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:8,padding:"6px 8px",fontSize:12,color:"#ef4444",cursor:"pointer"}}>🗑</button>}
          </div>
        </div>
      </Card>)}
      {accounts.length===0&&<p style={{color:"#666",textAlign:"center",marginTop:30}}>Nenhum usuário</p>}
    </div>}

    {tab==="requests"&&<div>
      {requests.length===0&&<p style={{color:"#666",textAlign:"center",marginTop:30}}>Nenhuma solicitação pendente</p>}
      {requests.map(r=><Card key={r.email}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#fff",fontWeight:600,fontSize:14}}>{r.name}</div>
            <div style={{color:"#666",fontSize:12}}>{r.email}</div>
            <div style={{color:"#888",fontSize:11}}>{new Date(r.requestedAt).toLocaleDateString("pt-BR")}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <Btn onClick={()=>handleApproveRequest(r)} color="#22c55e" disabled={loading} style={{width:"auto",padding:"6px 12px",fontSize:12}}>Aprovar</Btn>
            <Btn onClick={()=>handleRejectRequest(r)} color="#ef4444" style={{width:"auto",padding:"6px 12px",fontSize:12}}>Rejeitar</Btn>
          </div>
        </div>
      </Card>)}
    </div>}

    {tab==="create"&&<div>
      <Input label="Nome" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nome do usuário"/>
      <Input label="E-mail" type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="email@exemplo.com"/>
      <Btn onClick={handleCreateUser} disabled={loading}>{loading?"Criando...":"Criar Usuário e Enviar Senha"}</Btn>
    </div>}

    <Modal open={!!modal} onClose={()=>setModal(null)} title={"Alterar Senha — "+(modal?.name||"")}>
      <Input label="Nova Senha" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres"/>
      <Btn onClick={handleChangePassword} disabled={loading}>{loading?"Salvando...":"Salvar Nova Senha"}</Btn>
    </Modal>
  </div>);
}
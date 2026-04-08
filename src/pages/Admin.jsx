import{useState,useEffect}from"react";
import{getAllAccounts,saveAccount,deleteAccount,getSignupRequests,deleteSignupRequest,pb}from"../db";
import{sendPasswordEmail,generatePassword}from"../emailService";
import{Btn,Input}from"../components/FormElements";
import Modal from"../components/Modal";
import Card from"../components/Card";

export default function Admin({currentUser}){
  // Double-check: never render for non-admin (defense in depth against localStorage tampering)
  if(!currentUser||currentUser.role!=="admin")return null;

  const[accounts,setAccounts]=useState([]);const[requests,setRequests]=useState([]);
  const[tab,setTab]=useState("users");const[passModal,setPassModal]=useState(null);
  const[deleteModal,setDeleteModal]=useState(null);const[blockModal,setBlockModal]=useState(null);
  const[newName,setNewName]=useState("");const[newEmail,setNewEmail]=useState("");
  const[newPass,setNewPass]=useState("");const[msg,setMsg]=useState(null);const[loading,setLoading]=useState(false);

  const load=async()=>{
    const all=await getAllAccounts();
    setAccounts(all.filter(a=>!a.parentEmail));
    setRequests(await getSignupRequests());
  };
  useEffect(()=>{
    load();
    pb.collection("signup_requests").subscribe("*",()=>load());
    pb.collection("accounts").subscribe("*",()=>load());
    return()=>{pb.collection("signup_requests").unsubscribe("*");pb.collection("accounts").unsubscribe("*")};
  },[]);

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
    if(acc.protected)return; // nunca bloquear conta protegida
    if(acc.email===currentUser.email)return; // nunca auto-bloquear
    acc.status=acc.status==="blocked"?"active":"blocked";
    await saveAccount(acc);
    setBlockModal(null);await load();
  };

  const handleDelete=async(acc)=>{
    if(acc.protected)return;
    await deleteAccount(acc.email);setDeleteModal(null);await load();
  };

  const handleChangePassword=async()=>{
    if(!newPass||newPass.length<6){setMsg({t:"error",m:"Senha deve ter pelo menos 6 caracteres"});return}
    setLoading(true);
    try{
      passModal.password=newPass;passModal.mustChangePassword=true;await saveAccount(passModal);
      setMsg({t:"success",m:"Senha alterada!"});setPassModal(null);setNewPass("");await load();
    }catch(err){setMsg({t:"error",m:"Erro: "+err.message})}
    setLoading(false);
  };

  const navTabs=[{id:"users",label:"Usuários",icon:"👥"},{id:"requests",label:"Solicitações",icon:"📩",badge:requests.length},{id:"create",label:"Criar Usuário",icon:"➕"}];

  return(<div style={{padding:"0 4px"}}>
    <h2 style={{color:"#f1f5f9",margin:"0 0 16px",fontSize:20,fontWeight:700}}>Painel Admin</h2>

    <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
      {navTabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setMsg(null)}}
        style={{padding:"8px 14px",borderRadius:12,border:"none",background:tab===t.id?"#7c3aed":"rgba(255,255,255,0.05)",color:tab===t.id?"#fff":"#94a3b8",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
        {t.icon} {t.label}
        {t.badge>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700}}>{t.badge}</span>}
      </button>)}
    </div>

    {msg&&<div style={{padding:"11px 14px",borderRadius:12,marginBottom:12,fontSize:13,background:msg.t==="success"?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",color:msg.t==="success"?"#22c55e":"#ef4444",border:"1px solid "+(msg.t==="success"?"rgba(34,197,94,.2)":"rgba(239,68,68,.2)")}}>{msg.m}</div>}

    {tab==="users"&&<div>
      {accounts.map(a=>{
        const isSelf=a.email===currentUser.email;
        return(<Card key={a.email}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14,display:"flex",alignItems:"center",gap:6}}>
                {a.name}
                {a.protected&&<span style={{fontSize:14}}>🔒</span>}
                {a.role==="admin"&&<span style={{fontSize:10,background:"rgba(124,58,237,.2)",color:"#a78bfa",padding:"2px 8px",borderRadius:6,fontWeight:700}}>Admin</span>}
                {isSelf&&<span style={{fontSize:10,background:"rgba(34,197,94,.15)",color:"#22c55e",padding:"2px 8px",borderRadius:6,fontWeight:700}}>Você</span>}
              </div>
              <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{a.email}</div>
              <div style={{fontSize:11,color:a.status==="active"?"#22c55e":"#ef4444",marginTop:2,fontWeight:600}}>{a.status==="active"?"● Ativo":"● Bloqueado"}</div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>{setPassModal(a);setNewPass("");setMsg(null)}}
                style={{background:"rgba(124,58,237,.1)",border:"1px solid rgba(124,58,237,.25)",borderRadius:8,padding:"7px 9px",fontSize:13,color:"#a78bfa",cursor:"pointer"}}>🔑</button>
              {!a.protected&&!isSelf&&<button onClick={()=>setBlockModal(a)}
                style={{background:a.status==="active"?"rgba(245,158,11,.1)":"rgba(34,197,94,.1)",border:"1px solid "+(a.status==="active"?"rgba(245,158,11,.25)":"rgba(34,197,94,.25)"),borderRadius:8,padding:"7px 9px",fontSize:13,color:a.status==="active"?"#f59e0b":"#22c55e",cursor:"pointer"}}>
                {a.status==="active"?"🚫":"✅"}
              </button>}
              {!a.protected&&!isSelf&&<button onClick={()=>setDeleteModal(a)}
                style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",borderRadius:8,padding:"7px 9px",fontSize:13,color:"#ef4444",cursor:"pointer"}}>🗑</button>}
            </div>
          </div>
        </Card>);
      })}
      {accounts.length===0&&<p style={{color:"#64748b",textAlign:"center",marginTop:30}}>Nenhum usuário</p>}
    </div>}

    {tab==="requests"&&<div>
      {requests.length===0&&<p style={{color:"#64748b",textAlign:"center",marginTop:30}}>Nenhuma solicitação pendente</p>}
      {requests.map(r=><Card key={r.email}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{r.name}</div>
            <div style={{color:"#64748b",fontSize:12}}>{r.email}</div>
            <div style={{color:"#475569",fontSize:11,marginTop:2}}>{new Date(r.requestedAt).toLocaleDateString("pt-BR")}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <Btn onClick={()=>handleApproveRequest(r)} color="linear-gradient(135deg,#22c55e,#16a34a)" disabled={loading} style={{width:"auto",padding:"7px 14px",fontSize:13}}>Aprovar</Btn>
            <Btn onClick={()=>handleRejectRequest(r)} color="rgba(239,68,68,.15)" style={{width:"auto",padding:"7px 14px",fontSize:13,border:"1px solid rgba(239,68,68,.25)",color:"#ef4444"}}>Rejeitar</Btn>
          </div>
        </div>
      </Card>)}
    </div>}

    {tab==="create"&&<div>
      <Input label="Nome" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nome do usuário"/>
      <Input label="E-mail" type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="email@exemplo.com"/>
      <Btn onClick={handleCreateUser} disabled={loading}>{loading?"Criando...":"Criar Usuário e Enviar Senha"}</Btn>
    </div>}

    {/* Modal: alterar senha */}
    <Modal open={!!passModal} onClose={()=>setPassModal(null)} title={"Alterar Senha — "+(passModal?.name||"")}>
      <Input label="Nova Senha" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres"/>
      <Btn onClick={handleChangePassword} disabled={loading}>{loading?"Salvando...":"Salvar Nova Senha"}</Btn>
    </Modal>

    {/* Modal: confirmar bloqueio */}
    <Modal open={!!blockModal} onClose={()=>setBlockModal(null)} title={blockModal?.status==="active"?"Bloquear usuário":"Desbloquear usuário"}>
      {blockModal&&<>
        <p style={{color:"#94a3b8",fontSize:14,marginBottom:20,textAlign:"center"}}>
          {blockModal.status==="active"
            ?<>Deseja bloquear <strong style={{color:"#f1f5f9"}}>{blockModal.name}</strong>? Ele não conseguirá mais fazer login.</>
            :<>Deseja reativar <strong style={{color:"#f1f5f9"}}>{blockModal.name}</strong>?</>}
        </p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setBlockModal(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={()=>handleBlock(blockModal)} color={blockModal.status==="active"?"linear-gradient(135deg,#f59e0b,#d97706)":"linear-gradient(135deg,#22c55e,#16a34a)"} style={{flex:1}}>
            {blockModal.status==="active"?"Bloquear":"Desbloquear"}
          </Btn>
        </div>
      </>}
    </Modal>

    {/* Modal: confirmar exclusão */}
    <Modal open={!!deleteModal} onClose={()=>setDeleteModal(null)} title="Excluir usuário">
      {deleteModal&&<>
        <p style={{color:"#94a3b8",fontSize:14,marginBottom:8,textAlign:"center"}}>Deseja excluir <strong style={{color:"#f1f5f9"}}>{deleteModal.name}</strong>?</p>
        <p style={{color:"#ef4444",fontSize:12,marginBottom:20,textAlign:"center"}}>Esta ação não pode ser desfeita.</p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setDeleteModal(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={()=>handleDelete(deleteModal)} color="linear-gradient(135deg,#ef4444,#dc2626)" style={{flex:1}}>Excluir</Btn>
        </div>
      </>}
    </Modal>
  </div>);
}

const fs=require("fs"),path=require("path");
function w(f,c){const d=path.dirname(f);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});fs.writeFileSync(f,c.trimStart());console.log("✅ "+f)}

// ─── COMPONENTS ───
w("src/components/Modal.jsx",`export default function Modal({open,onClose,title,children}){
  if(!open)return null;
  return(<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#141428",borderRadius:"24px 24px 0 0",padding:"20px 20px 32px",width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto",animation:"slideUp .25s ease"}}>
      <div style={{width:40,height:4,background:"#333",borderRadius:2,margin:"0 auto 16px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h3 style={{margin:0,color:"#fff",fontSize:18,fontWeight:700}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#666",fontSize:22,cursor:"pointer",padding:4}}>✕</button>
      </div>{children}
    </div></div>);
}`);

w("src/components/Card.jsx",`export default function Card({children,style,onClick}){
  return(<div onClick={onClick} style={{background:"#141428",borderRadius:16,padding:14,marginBottom:10,border:"1px solid #1e1e3a",cursor:onClick?"pointer":"default",transition:"transform .1s",...(style||{})}}>{children}</div>);
}`);

w("src/components/FormElements.jsx",`export function Input({label,style,...props}){
  return(<div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",color:"#8888aa",fontSize:12,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{label}</label>}
    <input {...props} style={{width:"100%",padding:"12px 14px",background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:12,color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",transition:"border .2s",...(style||{})}}/>
  </div>)
}
export function Select({label,options,...props}){
  return(<div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",color:"#8888aa",fontSize:12,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{label}</label>}
    <select {...props} style={{width:"100%",padding:"12px 14px",background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:12,color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box"}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
  </div>)
}
export function Btn({children,color="linear-gradient(135deg,#7c3aed,#6d28d9)",style,disabled,...props}){
  return(<button disabled={disabled} {...props} style={{background:color,color:"#fff",border:"none",borderRadius:14,padding:"13px 20px",fontSize:15,fontWeight:700,cursor:disabled?"not-allowed":"pointer",width:"100%",opacity:disabled?.5:1,transition:"transform .1s",...(style||{})}}>{children}</button>)
}`);

w("src/components/Avatar.jsx",`export default function Avatar({name,color,size=36}){
  const i=(name||"?")[0].toUpperCase();
  return(<div style={{width:size,height:size,borderRadius:size*.35,background:color||"linear-gradient(135deg,#7c3aed,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:size*.4,fontWeight:700,flexShrink:0}}>{i}</div>);
}`);

// ─── LOGIN PAGE ───
w("src/pages/Login.jsx",`import{useState}from"react";
import{getAccount,addSignupRequest,saveAccount}from"../db";
import{sendPasswordEmail,generatePassword}from"../emailService";
import{Btn,Input}from"../components/FormElements";
import Modal from"../components/Modal";

export default function Login({onLogin}){
  const[mode,setMode]=useState("login");
  const[email,setEmail]=useState("");const[password,setPassword]=useState("");
  const[name,setName]=useState("");const[msg,setMsg]=useState(null);const[loading,setLoading]=useState(false);

  const handleLogin=async()=>{
    if(!email||!password){setMsg({t:"error",m:"Preencha todos os campos"});return}
    setLoading(true);
    const acc=await getAccount(email.trim().toLowerCase());
    if(!acc){setMsg({t:"error",m:"Conta não encontrada"});setLoading(false);return}
    if(acc.status==="blocked"){setMsg({t:"error",m:"Conta bloqueada. Contate o administrador."});setLoading(false);return}
    if(acc.password!==password){setMsg({t:"error",m:"Senha incorreta"});setLoading(false);return}
    setLoading(false);onLogin(acc);
  };

  const handleResetPassword=async()=>{
    if(!email){setMsg({t:"error",m:"Digite seu e-mail"});return}
    setLoading(true);
    const acc=await getAccount(email.trim().toLowerCase());
    if(!acc){setMsg({t:"error",m:"E-mail não cadastrado"});setLoading(false);return}
    if(acc.status==="blocked"){setMsg({t:"error",m:"Conta bloqueada"});setLoading(false);return}
    const newPass=generatePassword();
    try{
      await sendPasswordEmail(acc.name,acc.email,newPass);
      acc.password=newPass;acc.mustChangePassword=true;await saveAccount(acc);
      setMsg({t:"success",m:"Nova senha enviada para "+acc.email});setMode("login");
    }catch(e){setMsg({t:"error",m:"Erro ao enviar e-mail: "+e.message})}
    setLoading(false);
  };

  const handleSignupRequest=async()=>{
    if(!name||!email){setMsg({t:"error",m:"Preencha nome e e-mail"});return}
    const e=email.trim().toLowerCase();
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(e)){setMsg({t:"error",m:"E-mail inválido"});return}
    setLoading(true);
    const existing=await getAccount(e);
    if(existing){setMsg({t:"error",m:"E-mail já cadastrado"});setLoading(false);return}
    await addSignupRequest({email:e,name:name.trim(),requestedAt:new Date().toISOString(),status:"pending"});
    setMsg({t:"success",m:"Solicitação enviada! Aguarde aprovação do administrador."});setMode("login");
    setLoading(false);
  };

  const bg="linear-gradient(135deg,#7c3aed,#6d28d9)";

  return(<div style={{minHeight:"100vh",background:"#0a0a1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn .5s ease"}}>
    <div style={{width:"100%",maxWidth:380}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{width:80,height:80,borderRadius:24,background:bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:36,boxShadow:"0 8px 32px rgba(124,58,237,.4)"}}>💰</div>
        <h1 style={{fontSize:32,fontWeight:800,background:"linear-gradient(135deg,#a78bfa,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0}}>Finanças</h1>
        <p style={{color:"#666",fontSize:14,marginTop:4}}>Controle financeiro inteligente</p>
      </div>

      {msg&&<div style={{padding:"10px 14px",borderRadius:12,marginBottom:16,fontSize:13,background:msg.t==="success"?"#22c55e15":"#ef444415",color:msg.t==="success"?"#22c55e":"#ef4444",border:"1px solid "+(msg.t==="success"?"#22c55e30":"#ef444430")}}>{msg.m}</div>}

      {mode==="login"&&<>
        <Input label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/>
        <Input label="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
        <Btn onClick={handleLogin} disabled={loading}>{loading?"Entrando...":"Entrar"}</Btn>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>
          <button onClick={()=>{setMode("reset");setMsg(null)}} style={{background:"none",border:"none",color:"#7c3aed",fontSize:13,cursor:"pointer"}}>Esqueci a senha</button>
          <button onClick={()=>{setMode("signup");setMsg(null)}} style={{background:"none",border:"none",color:"#7c3aed",fontSize:13,cursor:"pointer"}}>Solicitar Cadastro</button>
        </div>
      </>}

      {mode==="reset"&&<>
        <p style={{color:"#888",fontSize:13,marginBottom:16}}>Digite seu e-mail cadastrado para receber uma nova senha.</p>
        <Input label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/>
        <Btn onClick={handleResetPassword} disabled={loading}>{loading?"Enviando...":"Enviar nova senha"}</Btn>
        <button onClick={()=>{setMode("login");setMsg(null)}} style={{background:"none",border:"none",color:"#7c3aed",fontSize:13,cursor:"pointer",marginTop:12,width:"100%",textAlign:"center"}}>Voltar ao login</button>
      </>}

      {mode==="signup"&&<>
        <p style={{color:"#888",fontSize:13,marginBottom:16}}>Preencha seus dados. O administrador irá aprovar seu cadastro.</p>
        <Input label="Nome" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"/>
        <Input label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/>
        <Btn onClick={handleSignupRequest} disabled={loading}>{loading?"Enviando...":"Solicitar Cadastro"}</Btn>
        <button onClick={()=>{setMode("login");setMsg(null)}} style={{background:"none",border:"none",color:"#7c3aed",fontSize:13,cursor:"pointer",marginTop:12,width:"100%",textAlign:"center"}}>Voltar ao login</button>
      </>}
    </div>
  </div>);
}`);

// ─── ADMIN PAGE ───
w("src/pages/Admin.jsx",`import{useState,useEffect}from"react";
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

  const load=async()=>{setAccounts(await getAllAccounts());setRequests(await getSignupRequests())};
  useEffect(()=>{load()},[]);

  const handleCreateUser=async()=>{
    if(!newName||!newEmail){setMsg({t:"error",m:"Preencha nome e e-mail"});return}
    const e=newEmail.trim().toLowerCase();
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(e)){setMsg({t:"error",m:"E-mail inválido"});return}
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
}`);

console.log("\\n✅ s2.cjs concluído! Agora rode: node s3.cjs\\n");
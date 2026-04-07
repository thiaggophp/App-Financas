import{useState}from"react";
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
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){setMsg({t:"error",m:"E-mail inválido"});return}
    setLoading(true);
    try{
      const existing=await getAccount(e);
      if(existing){setMsg({t:"error",m:"E-mail já cadastrado"});setLoading(false);return}
      await addSignupRequest({email:e,name:name.trim(),requestedAt:new Date().toISOString(),status:"pending"});
      setMsg({t:"success",m:"Solicitação enviada! Aguarde aprovação do administrador."});setMode("login");
    }catch(err){setMsg({t:"error",m:"Erro ao enviar solicitação: "+err.message});}
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
}
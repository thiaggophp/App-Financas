import{useState}from"react";
import{getAccount,addSignupRequest,saveAccount}from"../db";
import{sendPasswordEmail,generatePassword}from"../emailService";
import{Btn,Input}from"../components/FormElements";

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
      setMsg({t:"success",m:"Solicitação enviada! Aguarde aprovação."});setMode("login");
    }catch(err){setMsg({t:"error",m:"Erro: "+err.message});}
    setLoading(false);
  };

  return(<div style={{minHeight:"100vh",background:"#0a0a1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeIn .4s ease"}}>
    <div style={{width:"100%",maxWidth:380}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{width:76,height:76,borderRadius:22,background:"linear-gradient(135deg,#7c3aed,#6d28d9)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:34,boxShadow:"0 12px 40px rgba(124,58,237,.4)"}}>💰</div>
        <h1 style={{fontSize:30,fontWeight:800,background:"linear-gradient(135deg,#c4b5fd,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:"0 0 4px",letterSpacing:-.5}}>Finanças</h1>
        <p style={{color:"#475569",fontSize:13,margin:0}}>Controle financeiro inteligente</p>
      </div>

      {msg&&<div style={{padding:"11px 14px",borderRadius:12,marginBottom:18,fontSize:13,background:msg.t==="success"?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",color:msg.t==="success"?"#22c55e":"#ef4444",border:"1px solid "+(msg.t==="success"?"rgba(34,197,94,.2)":"rgba(239,68,68,.2)")}}>{msg.m}</div>}

      {mode==="login"&&<>
        <Input label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/>
        <Input label="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
        <Btn onClick={handleLogin} disabled={loading}>{loading?"Entrando...":"Entrar"}</Btn>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:18}}>
          <button onClick={()=>{setMode("reset");setMsg(null)}} style={{background:"none",border:"none",color:"#7c3aed",fontSize:13,cursor:"pointer",fontWeight:500}}>Esqueci a senha</button>
          <button onClick={()=>{setMode("signup");setMsg(null)}} style={{background:"none",border:"none",color:"#7c3aed",fontSize:13,cursor:"pointer",fontWeight:500}}>Solicitar Cadastro</button>
        </div>
      </>}

      {mode==="reset"&&<>
        <p style={{color:"#64748b",fontSize:13,marginBottom:18,lineHeight:1.5}}>Digite seu e-mail cadastrado para receber uma nova senha.</p>
        <Input label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/>
        <Btn onClick={handleResetPassword} disabled={loading}>{loading?"Enviando...":"Enviar nova senha"}</Btn>
        <button onClick={()=>{setMode("login");setMsg(null)}} style={{background:"none",border:"none",color:"#64748b",fontSize:13,cursor:"pointer",marginTop:14,width:"100%",textAlign:"center"}}>← Voltar ao login</button>
      </>}

      {mode==="signup"&&<>
        <p style={{color:"#64748b",fontSize:13,marginBottom:18,lineHeight:1.5}}>Preencha seus dados. O administrador irá aprovar seu cadastro.</p>
        <Input label="Nome" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome completo"/>
        <Input label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/>
        <Btn onClick={handleSignupRequest} disabled={loading}>{loading?"Enviando...":"Solicitar Cadastro"}</Btn>
        <button onClick={()=>{setMode("login");setMsg(null)}} style={{background:"none",border:"none",color:"#64748b",fontSize:13,cursor:"pointer",marginTop:14,width:"100%",textAlign:"center"}}>← Voltar ao login</button>
      </>}
    </div>
  </div>);
}

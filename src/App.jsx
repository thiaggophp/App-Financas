import{useState,useEffect}from"react";
import{initAdmin,getAccount,saveAccount}from"./db";
import Login from"./pages/Login";
import Dashboard from"./pages/Dashboard";
import Entries from"./pages/Entries";
import Goals from"./pages/Goals";
import Reports from"./pages/Reports";
import Groups from"./pages/Groups";
import Config from"./pages/Config";
import Admin from"./pages/Admin";
import Modal from"./components/Modal";
import{Btn,Input}from"./components/FormElements";
import InstallBanner from"./components/InstallBanner";

const tabs=[
  {id:"dash",label:"Início",icon:"⬡"},
  {id:"entries",label:"Lançar",icon:"💳"},
  {id:"groups",label:"Grupos",icon:"👥"},
  {id:"goals",label:"Metas",icon:"🎯"},
  {id:"reports",label:"Relatórios",icon:"📊"},
  {id:"config",label:"Config",icon:"⚙️"},
];

const VALID_TABS=["dash","entries","groups","goals","reports","config","admin"];
const getHashTab=()=>{const h=window.location.hash.slice(1);return VALID_TABS.includes(h)?h:"dash"};

export default function App(){
  const[user,setUser]=useState(null);
  const[tab,setTab]=useState(getHashTab);
  const[ready,setReady]=useState(false);
  const[changePassModal,setChangePassModal]=useState(false);
  const[newPass,setNewPass]=useState("");const[confirmPass,setConfirmPass]=useState("");const[passMsg,setPassMsg]=useState(null);
  const[refreshKey,setRefreshKey]=useState(0);

  useEffect(()=>{(async()=>{
    initAdmin().catch(()=>{});
    const saved=localStorage.getItem("financas_user");
    if(saved){
      const cached=JSON.parse(saved);
      try{
        const fresh=await getAccount(cached.email);
        if(!fresh||fresh.status==="blocked"){
          localStorage.removeItem("financas_user");
        }else if(fresh.status==="active"){
          setUser(fresh);localStorage.setItem("financas_user",JSON.stringify(fresh));
          if(fresh.mustChangePassword)setChangePassModal(true);
        }else{
          setUser(cached);
        }
      }catch{
        setUser(cached);
      }
    }
    setReady(true);
  })()},[]);

  useEffect(()=>{
    const onHash=()=>setTab(getHashTab());
    window.addEventListener("hashchange",onHash);
    return()=>window.removeEventListener("hashchange",onHash);
  },[]);

  useEffect(()=>{
    const onVisible=()=>{if(document.visibilityState==="visible")setRefreshKey(k=>k+1);};
    document.addEventListener("visibilitychange",onVisible);
    return()=>document.removeEventListener("visibilitychange",onVisible);
  },[]);

  const changeTab=(id)=>{setTab(id);window.location.hash=id;};

  const handleLogin=(acc)=>{
    setUser(acc);
    localStorage.setItem("financas_user",JSON.stringify(acc));
    changeTab("dash");
    if(acc.mustChangePassword)setChangePassModal(true);
  };

  const handleForceChangePass=async()=>{
    if(!newPass||newPass.length<6){setPassMsg("Mínimo 6 caracteres");return}
    if(newPass!==confirmPass){setPassMsg("Senhas não conferem");return}
    user.password=newPass;user.mustChangePassword=false;await saveAccount(user);
    setUser({...user});setChangePassModal(false);setNewPass("");setConfirmPass("");setPassMsg(null);
  };

  const logout=()=>{setUser(null);localStorage.removeItem("financas_user");window.location.hash="";};

  if(!ready)return(<div style={{minHeight:"100vh",background:"#0a0a1a",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{textAlign:"center"}}>
      <div style={{width:56,height:56,borderRadius:18,background:"linear-gradient(135deg,#7c3aed,#6d28d9)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:28,boxShadow:"0 8px 32px rgba(124,58,237,.4)"}}>💰</div>
      <div style={{color:"#7c3aed",fontSize:14,animation:"pulse 1.2s infinite",fontWeight:600}}>Carregando...</div>
    </div>
  </div>);
  if(!user)return <Login onLogin={handleLogin}/>;

  const allTabs=user.role==="admin"?[...tabs,{id:"admin",label:"Admin",icon:"🛡️"}]:tabs;

  const renderPage=()=>{
    switch(tab){
      case"dash":return<Dashboard user={user}/>;
      case"entries":return<Entries user={user}/>;
      case"groups":return<Groups user={user}/>;
      case"goals":return<Goals user={user}/>;
      case"reports":return<Reports user={user}/>;
      case"config":return<Config user={user} onUpdate={u=>setUser({...u})}/>;
      case"admin":return user.role==="admin"?<Admin currentUser={user}/>:null;
      default:return<Dashboard user={user}/>;
    }
  };

  return(<div style={{minHeight:"100vh",background:"#0a0a1a",paddingBottom:80}}>
    <div style={{padding:"14px 20px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"rgba(10,10,26,.92)",zIndex:100,backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
      <div>
        <div style={{fontSize:18,fontWeight:800,background:"linear-gradient(135deg,#c4b5fd,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-.3}}>Finanças</div>
        <div style={{color:"#475569",fontSize:11,marginTop:1}}>Olá, {user.name.split(" ")[0]}</div>
      </div>
      <button onClick={logout} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"7px 14px",color:"#ef4444",fontSize:13,fontWeight:600,cursor:"pointer"}}>Sair</button>
    </div>

    <div style={{padding:"16px 16px 0"}} key={refreshKey}>{renderPage()}</div>

    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,10,26,.95)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-around",padding:"8px 0 env(safe-area-inset-bottom,10px)",zIndex:100}}>
      {allTabs.map(t=>{
        const active=tab===t.id;
        return(<button key={t.id} onClick={()=>changeTab(t.id)}
          style={{background:"none",border:"none",color:active?"#a78bfa":"#475569",display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",gap:2,padding:"4px 8px",minWidth:44,transition:"color .15s"}}>
          <div style={{width:36,height:28,borderRadius:10,background:active?"rgba(124,58,237,.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,transition:"all .15s"}}>{t.icon}</div>
          <span style={{fontSize:9,fontWeight:active?700:500,letterSpacing:.3}}>{t.label}</span>
        </button>);
      })}
    </div>

    <InstallBanner/>
    <Modal open={changePassModal} onClose={()=>{}} title="Redefina sua senha">
      <p style={{color:"#94a3b8",fontSize:13,marginBottom:16}}>Você precisa criar uma nova senha antes de continuar.</p>
      {passMsg&&<div style={{color:"#ef4444",fontSize:12,marginBottom:10,background:"rgba(239,68,68,.1)",padding:"8px 12px",borderRadius:10}}>{passMsg}</div>}
      <Input label="Nova senha" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres"/>
      <Input label="Confirmar senha" type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Repita a senha"/>
      <Btn onClick={handleForceChangePass}>Salvar e Continuar</Btn>
    </Modal>
  </div>);
}

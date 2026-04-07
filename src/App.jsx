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

const tabs=[
  {id:"dash",label:"Home",icon:"🏠"},
  {id:"entries",label:"Lançar",icon:"💳"},
  {id:"groups",label:"Grupos",icon:"👥"},
  {id:"goals",label:"Metas",icon:"🎯"},
  {id:"reports",label:"Relatórios",icon:"📊"},
  {id:"config",label:"Config",icon:"⚙️"},
];

export default function App(){
  const[user,setUser]=useState(null);const[tab,setTab]=useState("dash");
  const[ready,setReady]=useState(false);
  const[changePassModal,setChangePassModal]=useState(false);
  const[newPass,setNewPass]=useState("");const[confirmPass,setConfirmPass]=useState("");const[passMsg,setPassMsg]=useState(null);

  useEffect(()=>{(async()=>{
    await initAdmin();
    try{const saved=sessionStorage.getItem("financas_user");if(saved){const acc=JSON.parse(saved);const fresh=await getAccount(acc.email);if(fresh&&fresh.status==="active"){setUser(fresh);if(fresh.mustChangePassword)setChangePassModal(true);}}}catch{}
    setReady(true);
  })()},[]);

  const handleLogin=(acc)=>{
    setUser(acc);setTab("dash");
    sessionStorage.setItem("financas_user",JSON.stringify({email:acc.email}));
    if(acc.mustChangePassword)setChangePassModal(true);
  };

  const handleForceChangePass=async()=>{
    if(!newPass||newPass.length<6){setPassMsg("Mínimo 6 caracteres");return}
    if(newPass!==confirmPass){setPassMsg("Senhas não conferem");return}
    user.password=newPass;user.mustChangePassword=false;await saveAccount(user);
    setUser({...user});setChangePassModal(false);setNewPass("");setConfirmPass("");setPassMsg(null);
  };

  const logout=()=>{setUser(null);setTab("dash");sessionStorage.removeItem("financas_user")};

  if(!ready)return(<div style={{minHeight:"100vh",background:"#0a0a1a",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#7c3aed",fontSize:18,animation:"pulse 1s infinite"}}>Carregando...</div></div>);
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
    <div style={{padding:"16px 16px 8px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#0a0a1a",zIndex:100,borderBottom:"1px solid #1a1a30"}}>
      <div>
        <h1 style={{margin:0,fontSize:20,fontWeight:800,background:"linear-gradient(135deg,#a78bfa,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Finanças</h1>
        <div style={{color:"#666",fontSize:11}}>Olá, {user.name}</div>
      </div>
      <button onClick={logout} style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:10,padding:"8px 14px",color:"#ef4444",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>🚪 Sair</button>
    </div>

    <div style={{padding:16}}>{renderPage()}</div>

    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0a0a1a",borderTop:"1px solid #1a1a30",display:"flex",justifyContent:"space-around",padding:"6px 0 env(safe-area-inset-bottom,8px)",zIndex:100}}>
      {allTabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)}
        style={{background:"none",border:"none",color:tab===t.id?"#7c3aed":"#555",display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",fontSize:9,fontWeight:tab===t.id?700:400,gap:1,padding:"4px 6px"}}>
        <span style={{fontSize:18}}>{t.icon}</span>{t.label}
      </button>)}
    </div>

    <Modal open={changePassModal} onClose={()=>{}} title="Redefina sua senha">
      <p style={{color:"#888",fontSize:13,marginBottom:14}}>Você precisa criar uma nova senha antes de continuar.</p>
      {passMsg&&<div style={{color:"#ef4444",fontSize:12,marginBottom:8}}>{passMsg}</div>}
      <Input label="Nova senha" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres"/>
      <Input label="Confirmar senha" type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Repita a senha"/>
      <Btn onClick={handleForceChangePass}>Salvar e Continuar</Btn>
    </Modal>
  </div>);
}
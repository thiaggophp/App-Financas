import{useState,useEffect}from"react";
import{getGroups,saveGroup,deleteGroup,getMembers,getMembersByGroup,saveMember,deleteMember}from"../db";
import{Btn,Input}from"../components/FormElements";
import Modal from"../components/Modal";import Card from"../components/Card";import Avatar from"../components/Avatar";

const COLORS=["#7c3aed","#3b82f6","#22c55e","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16"];

export default function Groups({user}){
  const[groups,setGroups]=useState([]);const[members,setMembers]=useState([]);
  const[groupModal,setGroupModal]=useState(false);const[memberModal,setMemberModal]=useState(false);
  const[selGroup,setSelGroup]=useState(null);
  const[groupName,setGroupName]=useState("");const[memberName,setMemberName]=useState("");
  const[editGroup,setEditGroup]=useState(null);

  const reload=async()=>{setGroups(await getGroups(user.email));setMembers(await getMembers(user.email))};
  useEffect(()=>{reload()},[user.email]);

  const saveG=async()=>{
    if(!groupName.trim())return;
    const g={id:editGroup?editGroup.id:Date.now()+"-"+Math.random().toString(36).slice(2,6),ownerEmail:user.email,name:groupName.trim(),color:COLORS[groups.length%COLORS.length],createdAt:editGroup?editGroup.createdAt:new Date().toISOString()};
    await saveGroup(g);setGroupModal(false);setGroupName("");setEditGroup(null);await reload();
  };

  const removeG=async(g)=>{
    if(!confirm("Excluir grupo "+g.name+" e todos os membros?")){return}
    const gMembers=await getMembersByGroup(g.id);
    for(const m of gMembers)await deleteMember(m.id);
    await deleteGroup(g.id);if(selGroup?.id===g.id)setSelGroup(null);await reload();
  };

  const saveM=async()=>{
    if(!memberName.trim()||!selGroup)return;
    const m={id:Date.now()+"-"+Math.random().toString(36).slice(2,6),ownerEmail:user.email,groupId:selGroup.id,name:memberName.trim(),color:COLORS[(members.length+1)%COLORS.length],createdAt:new Date().toISOString()};
    await saveMember(m);setMemberModal(false);setMemberName("");await reload();
  };

  const removeM=async(m)=>{await deleteMember(m.id);await reload()};

  const groupMembers=selGroup?members.filter(m=>m.groupId===selGroup.id):[];

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{color:"#fff",margin:0,fontSize:20}}>Grupos & Membros</h2>
      <Btn onClick={()=>{setEditGroup(null);setGroupName("");setGroupModal(true)}} style={{width:"auto",padding:"8px 16px",fontSize:13}}>+ Grupo</Btn>
    </div>

    {groups.length===0&&<p style={{color:"#666",textAlign:"center",marginTop:30}}>Crie seu primeiro grupo para começar</p>}

    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:12}}>
      {groups.map(g=>{const cnt=members.filter(m=>m.groupId===g.id).length;
        return(<div key={g.id} onClick={()=>setSelGroup(selGroup?.id===g.id?null:g)}
          style={{minWidth:120,padding:12,borderRadius:14,background:selGroup?.id===g.id?g.color+"20":"#141428",border:"1px solid "+(selGroup?.id===g.id?g.color:"#1e1e3a"),cursor:"pointer",textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:20,marginBottom:4}}>👥</div>
          <div style={{color:"#fff",fontWeight:600,fontSize:13}}>{g.name}</div>
          <div style={{color:"#888",fontSize:11}}>{cnt} membro{cnt!==1?"s":""}</div>
        </div>);
      })}
    </div>

    {selGroup&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h3 style={{color:selGroup.color,margin:0,fontSize:16}}>{selGroup.name}</h3>
        <div style={{display:"flex",gap:6}}>
          <Btn onClick={()=>setMemberModal(true)} style={{width:"auto",padding:"6px 12px",fontSize:12}}>+ Membro</Btn>
          <button onClick={()=>{setEditGroup(selGroup);setGroupName(selGroup.name);setGroupModal(true)}} style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:8,padding:"6px 8px",fontSize:12,color:"#7c3aed",cursor:"pointer"}}>✏️</button>
          <button onClick={()=>removeG(selGroup)} style={{background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:8,padding:"6px 8px",fontSize:12,color:"#ef4444",cursor:"pointer"}}>🗑</button>
        </div>
      </div>

      {groupMembers.map(m=><Card key={m.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <Avatar name={m.name} color={m.color} size={32}/>
            <span style={{color:"#fff",fontWeight:600,fontSize:14}}>{m.name}</span>
          </div>
          <button onClick={()=>removeM(m)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:14}}>🗑</button>
        </div>
      </Card>)}
      {groupMembers.length===0&&<p style={{color:"#666",textAlign:"center",marginTop:16,fontSize:13}}>Nenhum membro neste grupo</p>}
    </div>}

    <Modal open={groupModal} onClose={()=>setGroupModal(false)} title={editGroup?"Editar Grupo":"Novo Grupo"}>
      <Input label="Nome do grupo" value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Ex: Casa, Família..."/>
      <Btn onClick={saveG}>{editGroup?"Salvar":"Criar Grupo"}</Btn>
    </Modal>

    <Modal open={memberModal} onClose={()=>setMemberModal(false)} title={"Novo Membro — "+(selGroup?.name||"")}>
      <Input label="Nome do membro" value={memberName} onChange={e=>setMemberName(e.target.value)} placeholder="Ex: João, Maria..."/>
      <Btn onClick={saveM}>Adicionar Membro</Btn>
    </Modal>
  </div>);
}
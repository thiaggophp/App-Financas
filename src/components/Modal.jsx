export default function Modal({open,onClose,title,children}){
  if(!open)return null;
  return(<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#141428",borderRadius:"24px 24px 0 0",padding:"20px 20px 32px",width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto",animation:"slideUp .25s ease"}}>
      <div style={{width:40,height:4,background:"#333",borderRadius:2,margin:"0 auto 16px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h3 style={{margin:0,color:"#fff",fontSize:18,fontWeight:700}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#666",fontSize:22,cursor:"pointer",padding:4}}>✕</button>
      </div>{children}
    </div></div>);
}
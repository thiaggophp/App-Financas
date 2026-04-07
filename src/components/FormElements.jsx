export function Input({label,style,...props}){
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
}
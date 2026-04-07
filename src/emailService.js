const SERVICE_ID="service_d0uex69";
const TEMPLATE_ID="template_nzuzzgq";
const PUBLIC_KEY="5R9ZxFkk-UzbIXlGh";

export function generatePassword(len=8){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let p="";for(let i=0;i<len;i++)p+=chars[Math.floor(Math.random()*chars.length)];return p;
}

export async function sendPasswordEmail(toName,toEmail,tempPassword){
  const url="https://api.emailjs.com/api/v1.0/email/send";
  const payload={service_id:SERVICE_ID,template_id:TEMPLATE_ID,user_id:PUBLIC_KEY,
    template_params:{to_name:toName,to_email:toEmail,user_email:toEmail,temp_password:tempPassword}};
  const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  if(!res.ok)throw new Error("Falha ao enviar e-mail: "+res.status);
  return true;
}

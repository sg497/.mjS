
function applyTheme(){
  const saved=localStorage.getItem("ks-theme");
  const theme=saved || (window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
  document.documentElement.dataset.theme=theme;
  const b=document.querySelector("#themeToggle");
  if(b)b.textContent=theme==="dark"?"☀":"☾";
}
function toggleTheme(){
  const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
  localStorage.setItem("ks-theme",next);
  applyTheme();
}
document.addEventListener("DOMContentLoaded",()=>{
  applyTheme();
  document.querySelector("#themeToggle")?.addEventListener("click",toggleTheme);
});

async function api(url,opts={}){const r=await fetch(url,opts);if(r.status===401||r.status===403){location.href="/admin-login.html";throw new Error("Acesso negado")}return [r,await r.json()]}
const $=s=>document.querySelector(s);
async function init(){try{await api("/api/admin/summary");await refresh();await loadMethods()}catch(e){}}
async function refresh(){const [,s]=await api("/api/admin/summary");$("#revenue").textContent=money(s.revenue);$("#orders").textContent=s.orders;$("#pending").textContent=s.pending;$("#refunds").textContent=s.refunds;const [,d]=await api("/api/admin/payments");render(d.payments)}
async function loadMethods(){const [,d]=await api("/api/admin/payment-methods");$("#methods").innerHTML=d.methods.map(m=>`<div class="method-row"><div><strong>${m.name}</strong><small>${m.code}</small><textarea id="ins-${m.id}">${m.instructions}</textarea></div><label class="switch"><input type="checkbox" id="act-${m.id}" ${m.active?'checked':''}><span></span></label><button class="save-method" onclick="saveMethod(${m.id})">Salvar</button></div>`).join("")}
async function saveMethod(id){const row={name:$(`#ins-${id}`).previousElementSibling?.textContent};const textarea=$(`#ins-${id}`);const checkbox=$(`#act-${id}`);const name=textarea.parentElement.querySelector("strong").textContent;const r=await fetch("/api/admin/payment-methods/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,instructions:textarea.value,active:checkbox.checked})});if(!r.ok){const d=await r.json();alert(d.error||"Erro");return}alert("Método atualizado.")}
function money(v){return "R$ "+Number(v).toFixed(2).replace(".",",")}
function render(list){const q=$("#filter").value.toLowerCase(),sf=$("#statusFilter").value;list=list.filter(p=>(p.student+" "+p.course+" "+p.payment_method).toLowerCase().includes(q)&&(sf==="todos"||p.status===sf));$("#payments").innerHTML=list.length?list.map(p=>`<tr><td><b>${p.student}</b><br><span style="color:#888">${p.email}</span></td><td>${p.course}</td><td>${p.payment_method}</td><td><b>${money(p.amount)}</b></td><td>${new Date(p.created_at).toLocaleString("pt-BR")}</td><td><span class="status ${p.status}">${label(p.status)}</span></td><td class="actions">${p.status==="pending"?`<button onclick="status(${p.id},'approved')">Aprovar</button>`:""}${p.status==="approved"?`<button onclick="status(${p.id},'refunded')">Reembolsar</button>`:""}<button onclick="removePayment(${p.id})">Excluir</button></td></tr>`).join(""):`<tr><td colspan="7" style="text-align:center;padding:35px;color:#888">Nenhum pagamento encontrado.</td></tr>`}
function label(s){return s==="approved"?"Aprovado":s==="pending"?"Pendente":"Reembolsado"}
async function status(id,s){await api("/api/admin/payments/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:s})});refresh()}
async function removePayment(id){if(!confirm("Excluir esta transação?"))return;await api("/api/admin/payments/"+id,{method:"DELETE"});refresh()}
async function logout(){await fetch("/api/logout",{method:"POST"});location.href="/admin-login.html"}
$("#filter").addEventListener("input",async()=>{const [,d]=await api("/api/admin/payments");render(d.payments)});
$("#statusFilter").addEventListener("change",async()=>{const [,d]=await api("/api/admin/payments");render(d.payments)});
init();
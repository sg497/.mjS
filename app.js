
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

let courses=[]; let mode="login"; let selectedCourse=null; let paymentMethods=[];
const $=s=>document.querySelector(s);
window.addEventListener("load",async()=>{setTimeout(()=>$("#splash").classList.add("hide-splash"),900);await loadMe();await loadCourses();});
async function loadMe(){const r=await fetch("/api/me");const d=await r.json();if(d.user){$("#userArea").innerHTML=`<span class="hello">Olá, ${d.user.name.split(" ")[0]}</span><button class="outline" onclick="logout()">Sair</button>${d.user.role==="admin"?'<a class="btn-red" href="/admin">Admin</a>':''}`}}
async function loadCourses(){const r=await fetch("/api/courses");courses=(await r.json()).courses;renderCourses(courses)}
function renderCourses(list){$("#courses").innerHTML=list.length?list.map(c=>`<article class="course"><img src="${c.image}" alt="${c.title}"><div class="course-body"><h3>${c.title}</h3><p>${c.description}</p><div class="course-foot"><span style="font-size:11px">👤 ${c.instructor}</span><span>★ ${c.rating}</span></div><div class="course-foot"><strong>R$ ${c.price.toFixed(2).replace(".",",")}</strong><button class="buy" onclick="buy(${c.id})">Comprar</button></div></div></article>`).join(""):`<div>Nenhum curso encontrado.</div>`}
function openAuth(m){mode=m;$("#auth").classList.add("show");switchAuth(m)}
function closeAuth(){$("#auth").classList.remove("show")}
function switchAuth(m){mode=m;$("#tabLogin").classList.toggle("active",m==="login");$("#tabRegister").classList.toggle("active",m==="register");$("#nameLabel").style.display=m==="register"?"block":"none";$("#authSubmit").textContent=m==="register"?"Criar conta":"Entrar";$("#authMsg").textContent=""}
$("#authForm").addEventListener("submit",async e=>{e.preventDefault();$("#authMsg").textContent="Processando...";const body={email:$("#email").value.trim(),password:$("#password").value};if(mode==="register")body.name=$("#name").value.trim();const r=await fetch(mode==="register"?"/api/register":"/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok){$("#authMsg").textContent=d.error||"Não foi possível processar.";return}closeAuth();await loadMe();if(selectedCourse)openCheckout(selectedCourse.id)});
async function createDemo(){const r=await fetch("/api/demo-account",{method:"POST"});const d=await r.json();if(r.ok){closeAuth();await loadMe();alert(`Conta de demonstração criada.\nE-mail: ${d.email}\nSenha: ${d.password}`)}else $("#authMsg").textContent=d.error||"Erro"}
async function logout(){await fetch("/api/logout",{method:"POST"});location.reload()}
async function buy(id){const me=await (await fetch("/api/me")).json();selectedCourse=courses.find(c=>c.id===id);if(!me.user){openAuth("login");$("#authMsg").textContent="Entre na sua conta para continuar a compra.";return}openCheckout(id)}
async function openCheckout(id){selectedCourse=courses.find(c=>c.id===id);const r=await fetch("/api/payment-methods");paymentMethods=(await r.json()).methods;$("#checkoutTitle").textContent=selectedCourse.title;$("#checkoutPrice").textContent="R$ "+selectedCourse.price.toFixed(2).replace(".",",");$("#paymentMethod").innerHTML=paymentMethods.length?paymentMethods.map(m=>`<option value="${m.id}">${m.name}</option>`).join(""):"<option>Nenhum método disponível</option>";renderPaymentInfo();$("#checkout").classList.add("show")}
function closeCheckout(){$("#checkout").classList.remove("show")}
function renderPaymentInfo(){const m=paymentMethods.find(x=>String(x.id)===$("#paymentMethod").value);$("#paymentInfo").textContent=m?m.instructions:""}
$("#paymentMethod").addEventListener("change",renderPaymentInfo);
$("#checkoutForm").addEventListener("submit",async e=>{e.preventDefault();const methodId=$("#paymentMethod").value;const r=await fetch("/api/payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({course_id:selectedCourse.id,payment_method_id:methodId})});const d=await r.json();if(!r.ok){$("#checkoutMsg").textContent=d.error||"Erro ao criar pedido.";return}$("#checkoutMsg").textContent=`Pedido #${d.payment_id} criado. ${d.instructions||""}`;$("#checkoutSubmit").disabled=true;setTimeout(()=>{closeCheckout();$("#checkoutSubmit").disabled=false;$("#checkoutMsg").textContent=""},2800)});
$("#search").addEventListener("input",e=>{const q=e.target.value.toLowerCase();renderCourses(courses.filter(c=>(c.title+c.category+c.description).toLowerCase().includes(q)))});
document.querySelectorAll("[data-cat]").forEach(b=>b.addEventListener("click",()=>{renderCourses(courses.filter(c=>c.category===b.dataset.cat));$("#cursos").scrollIntoView({behavior:"smooth"})}));

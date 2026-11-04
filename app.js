/* Zelar — UI de demonstração. Sem autenticação nem integração de hardware reais. */
"use strict";
const DEMO_USER="admin@demo.zelar.local";
const DEMO_PASS="zelar-demo";
const AUTH_KEY="zelar-demo-session";
const DATA_KEY="zelar-demo-data-v1";
const $=(selector)=>document.querySelector(selector);
const esc=(s)=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const seed={
 homes:[{id:1,name:"Casa da Maria",resident:"Maria",rooms:[{id:1,name:"Sala",state:"presence",icon:"⌂"},{id:2,name:"Cozinha",state:"empty",icon:"◈"},{id:3,name:"Quarto",state:"empty",icon:"☾"},{id:4,name:"Casa de banho",state:"empty",icon:"◉"}]}],
 sensors:[{id:1,homeId:1,roomId:1,name:"Presença da sala",model:"Aqara FP2",status:"Simulado"},{id:2,homeId:1,roomId:3,name:"Presença do quarto",model:"Aqara FP2",status:"Simulado"},{id:3,homeId:1,roomId:2,name:"Porta da cozinha",model:"Aqara P2",status:"Simulado"}],
 alerts:[{id:1,homeId:1,kind:"Sensor sem ligação real",created:"Demonstração",ack:false}],
 events:[{id:1,description:"Presença simulada na sala",when:"Agora",homeId:1},{id:2,description:"Estado da habitação carregado",when:"Demonstração",homeId:1}]
};
function readData(){try{const d=JSON.parse(sessionStorage.getItem(DATA_KEY));if(d&&Array.isArray(d.homes)&&Array.isArray(d.sensors)&&Array.isArray(d.alerts)&&Array.isArray(d.events))return d;}catch(_){}return JSON.parse(JSON.stringify(seed));}
let data=readData();
function save(){sessionStorage.setItem(DATA_KEY,JSON.stringify(data));}
function initHome(){const y=$("#year");if(y)y.textContent=new Date().getFullYear();}
function initLogin(){
 if(sessionStorage.getItem(AUTH_KEY)==="demo" && ["super","empresa","familiar"].includes(sessionStorage.getItem("zelar-demo-role"))) location.replace(({super:"superadmin.html",empresa:"empresa.html",familiar:"familiar.html"})[sessionStorage.getItem("zelar-demo-role")]);
 $("#togglePassword").addEventListener("click",()=>{const input=$("#password");const show=input.type==="password";input.type=show?"text":"password";$("#togglePassword").textContent=show?"Ocultar":"Mostrar";});
 $("#loginForm").addEventListener("submit",e=>{e.preventDefault();const email=$("#email").value.trim().toLowerCase();const password=$("#password").value;const error=$("#loginError");if(email===DEMO_USER&&password===DEMO_PASS){const role=$("#roleSelect").value; if(!["super","empresa","familiar"].includes(role)){error.textContent="Perfil inválido";return;} sessionStorage.setItem(AUTH_KEY,"demo");sessionStorage.setItem("zelar-demo-role",role);location.href=({super:"superadmin.html",empresa:"empresa.html",familiar:"familiar.html"})[role];}else{error.textContent="Credenciais de demonstração incorretas. Consulta os dados abaixo."; }});
}
function event(description,homeId=1){data.events.unshift({id:Date.now(),description,when:new Date().toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}),homeId});data.events=data.events.slice(0,30);save();}
function render(){
 $("#statHomes").textContent=data.homes.length;
 $("#statSensors").textContent=data.sensors.length;
 $("#statAlerts").textContent=data.alerts.filter(a=>!a.ack).length;
 $("#statRooms").textContent=data.homes.reduce((n,h)=>n+h.rooms.length,0);
 const picker=$("#homePicker"),old=Number(picker.value)||1;
 picker.innerHTML=data.homes.map(h=>'<option value="'+h.id+'">'+esc(h.name)+'</option>').join("");
 picker.value=String(data.homes.some(h=>h.id===old)?old:(data.homes[0]?.id||""));
 renderFloor();
 $("#recentEvents").innerHTML=data.events.slice(0,5).map(e=>'<div class="event"><div class="event-bullet">↗</div><div><strong>'+esc(e.description)+'</strong><small>'+esc(e.when)+'</small></div></div>').join("")||'<p class="empty-state">Sem eventos</p>';
 $("#homesList").innerHTML=data.homes.map(h=>'<div class="data-row"><div><strong>'+esc(h.name)+'</strong><small>Residente: '+esc(h.resident)+' · '+h.rooms.length+' divisões</small></div><span class="status">Demonstração</span></div>').join("");
 $("#sensorsList").innerHTML=data.sensors.map(s=>{const h=data.homes.find(x=>x.id===s.homeId);const r=h?.rooms.find(x=>x.id===s.roomId);return '<div class="data-row"><div><strong>'+esc(s.name)+'</strong><small>'+esc(s.model)+' · '+esc(h?.name||"—")+' / '+esc(r?.name||"—")+'</small></div><span class="status">'+esc(s.status)+'</span></div>';}).join("")||'<p class="empty-state">Ainda não existem equipamentos.</p>';
 $("#alertsList").innerHTML=data.alerts.map(a=>'<div class="data-row"><div><strong>'+esc(a.kind)+'</strong><small>'+esc(a.created)+'</small></div>'+(a.ack?'<span class="status ok">Reconhecido</span>':'<button class="btn btn-outline btn-small" data-ack="'+a.id+'">Reconhecer</button>')+'</div>').join("")||'<p class="empty-state">Não existem alertas.</p>';
 document.querySelectorAll("[data-ack]").forEach(btn=>btn.addEventListener("click",()=>{const a=data.alerts.find(x=>x.id===Number(btn.dataset.ack));if(a){a.ack=true;save();render();}}));
}
function renderFloor(){
 const home=data.homes.find(h=>h.id===Number($("#homePicker").value));
 const floor=$("#floorplan");
 if(!home){floor.innerHTML='<p class="empty-state">Sem habitações registadas.</p>';return;}
 floor.innerHTML=home.rooms.map((r,i)=>'<button type="button" class="floor-room '+(r.state==="presence"?"presence":"")+'" data-room="'+r.id+'"><span class="room-icon">'+esc(r.icon||"⌂")+'</span><span>'+esc(r.name)+'</span><small>'+(r.state==="presence"?"● Presença simulada":"Sem atividade simulada")+'</small></button>').join("");
 $("#roomDetail").textContent="Seleciona uma divisão para veres o seu estado.";
 floor.querySelectorAll("[data-room]").forEach(b=>b.addEventListener("click",()=>{floor.querySelectorAll(".floor-room").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");const room=home.rooms.find(r=>r.id===Number(b.dataset.room));$("#roomDetail").textContent=room.name+": "+(room.state==="presence"?"presença simulada detetada.":"sem atividade simulada.") }));
}
function showModal(title,fields,onSave){
 const dlg=$("#modal");$("#modalTitle").textContent=title;$("#modalFields").innerHTML=fields;dlg.showModal();
 $("#modalForm").onsubmit=e=>{e.preventDefault();const form=new FormData($("#modalForm"));const fields=Object.fromEntries(form.entries());if(onSave(fields)!==false){dlg.close();render();}};
}
function initAdmin(){
 if(sessionStorage.getItem(AUTH_KEY)!=="demo"){location.replace("login.html");return;}
 $("#logoutBtn").addEventListener("click",()=>{sessionStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(DATA_KEY);location.href="login.html";});
 $("#menuToggle").addEventListener("click",()=>$(".sidebar").classList.toggle("open"));
 document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>{const tab=btn.dataset.tab;document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b===btn));document.querySelectorAll(".tab-panel").forEach(p=>p.classList.toggle("hidden",p.id!=="tab-"+tab));$("#breadcrumb").textContent=btn.textContent.trim();$(".sidebar").classList.remove("open")}));
 $("#homePicker").addEventListener("change",renderFloor);
 $("#simulateMove").addEventListener("click",()=>{const home=data.homes.find(h=>h.id===Number($("#homePicker").value));if(!home||!home.rooms.length)return;const current=home.rooms.findIndex(r=>r.state==="presence");home.rooms.forEach(r=>r.state="empty");const next=home.rooms[(current+1)%home.rooms.length];next.state="presence";event("Presença simulada em "+next.name,home.id);render();});
 $("#simulateAlert").addEventListener("click",()=>{data.alerts.unshift({id:Date.now(),homeId:data.homes[0]?.id||1,kind:"Alerta de demonstração — verificar situação",created:new Date().toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}),ack:false});event("Alerta simulado criado");save();render();});
 $("#addHomeBtn").addEventListener("click",()=>showModal("Nova habitação",'<label for="homeName">Nome da habitação</label><input id="homeName" name="name" required maxlength="80"><label for="residentName">Nome fictício do residente</label><input id="residentName" name="resident" required maxlength="80">',fields=>{data.homes.push({id:Date.now(),name:fields.name.trim(),resident:fields.resident.trim(),rooms:[{id:Date.now()+1,name:"Sala",state:"empty",icon:"⌂"},{id:Date.now()+2,name:"Quarto",state:"empty",icon:"☾"}]});event("Habitação de demonstração criada");save();}));
 $("#addSensorBtn").addEventListener("click",()=>{const opts=data.homes.flatMap(h=>h.rooms.map(r=>'<option value="'+h.id+':'+r.id+'">'+esc(h.name)+' — '+esc(r.name)+'</option>')).join("");showModal("Adicionar sensor Aqara",'<label for="sensorName">Nome do equipamento</label><input id="sensorName" name="name" required maxlength="80"><label for="sensorModel">Modelo</label><select id="sensorModel" name="model"><option>Aqara FP2</option><option>Aqara Door and Window P2</option><option>Aqara Motion P1</option><option>Aqara Hub M3</option></select><label for="sensorRoom">Divisão</label><select id="sensorRoom" name="destination" required>'+opts+'</select>',fields=>{const [homeId,roomId]=fields.destination.split(":").map(Number);data.sensors.push({id:Date.now(),homeId,roomId,name:fields.name.trim(),model:fields.model,status:"Simulado"});event("Sensor de demonstração adicionado",homeId);save();});});
 $("#cancelModal").addEventListener("click",()=>$("#modal").close());
 $("#closeModal").addEventListener("click",()=>$("#modal").close());
 render();
}
const page=document.body.dataset.page;
if(page==="home")initHome();
if(page==="login")initLogin();
if(page==="admin")initAdmin();

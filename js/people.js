/* Manage People: teacher/student access-code management */
let peopleMode = "student";
let generatedPersonDetails = "";
const peopleModal = document.getElementById("peopleModal");
const managePeopleButton = document.getElementById("managePeopleButton");
const peopleClose = document.getElementById("peopleClose");
const addTeacherTab = document.getElementById("addTeacherTab");
const addStudentTab = document.getElementById("addStudentTab");
const personNameLabel = document.getElementById("personNameLabel");
const personNameInput = document.getElementById("personNameInput");
const teacherSelectWrap = document.getElementById("teacherSelectWrap");
const teacherSelect = document.getElementById("teacherSelect");
const generatePersonBtn = document.getElementById("generatePersonBtn");
const generatedPersonBox = document.getElementById("generatedPersonBox");
const generatedPersonText = document.getElementById("generatedPersonText");
const copyPersonBtn = document.getElementById("copyPersonBtn");
const peopleStatus = document.getElementById("peopleStatus");
const peopleList = document.getElementById("peopleList");

function isCurrentTeacher(){ return joined && roleInput && roleInput.value === "teacher"; }
function isAdminTeacher(){ return isCurrentTeacher() && accessCodeInput && normalizeAccessCode(accessCodeInput.value) === "HR-001"; }
function randomAccessCode(prefix){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s=prefix+"-"; for(let i=0;i<6;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}
function setPeopleMode(mode){
  peopleMode=mode;
  addTeacherTab.style.background=mode==="teacher"?"#079c85":"#102b40";
  addStudentTab.style.background=mode==="student"?"#079c85":"#102b40";
  personNameLabel.textContent=mode==="teacher"?"Teacher Name":"Student Name";
  personNameInput.value="";
  personNameInput.placeholder=mode==="teacher"?"Enter new teacher name":"Enter new student name";
  teacherSelectWrap.style.display=mode==="student"?"block":"none";
  generatedPersonBox.style.display="none";
  peopleStatus.textContent="";
  if(mode==="student") loadTeacherOptions();
}
async function loadTeacherOptions(){
  teacherSelect.innerHTML="";
  const add=(code,name)=>{
    if([...teacherSelect.options].some(o=>o.value===code)) return;
    const o=document.createElement("option"); o.value=code; o.textContent=name+" ("+code+")"; teacherSelect.appendChild(o);
  };
  Object.entries(ROOM_ACCESS.teachers).forEach(([code,v])=>add(code,v.name));
  const client=initSupabase();
  if(client){
    const {data}=await client.from("class_access").select("access_code,name").eq("role","teacher").eq("active",true);
    (data||[]).forEach(t=>add(t.access_code,t.name));
  }
}
async function loadPeople(){
  peopleList.innerHTML='<div style="padding:10px;color:#8da8b5;font-size:11px">Loading...</div>';
  const client=initSupabase();
  if(!client){ peopleList.innerHTML='<div style="padding:10px;color:#d99;font-size:11px">Supabase not connected.</div>'; return; }
  const {data,error}=await client.from("class_access").select("access_code,role,name,room,active").eq("active",true).order("created_at",{ascending:true});
  if(error){ peopleList.innerHTML='<div style="padding:10px;color:#d99;font-size:11px">Run the one-time Supabase SQL setup first.</div>'; return; }
  if(!data?.length){ peopleList.innerHTML='<div style="padding:10px;color:#8da8b5;font-size:11px">No newly created accounts yet.</div>'; return; }
  peopleList.innerHTML="";
  data.forEach(row=>{
    const div=document.createElement("div"); div.className="people-row";
    const info=document.createElement("div"); info.className="people-info";
    const n=document.createElement("div"); n.className="people-name"; n.textContent=row.name+" ";
    const r=document.createElement("span"); r.className="people-role"; r.textContent=row.role; n.appendChild(r);
    const c=document.createElement("div"); c.className="people-code"; c.textContent=row.access_code;
    info.appendChild(n); info.appendChild(c);
    const b=document.createElement("button"); b.className="people-copy"; b.textContent="Copy";
    b.onclick=()=>navigator.clipboard?.writeText("Name: "+row.name+"\nAccess Code: "+row.access_code).then(()=>showToast("Details copied"));
    div.appendChild(info); div.appendChild(b);

    if(normalizeAccessCode(row.access_code)!=="HR-001"){
      const d=document.createElement("button");
      d.className="people-disable";
      d.textContent="Delete";
      d.title="Disable this access code";
      d.onclick=()=>deactivatePerson(row.access_code,row.name);
      div.appendChild(d);
    }

    peopleList.appendChild(div);
  });
}
async function deactivatePerson(code,name){
  if(!isAdminTeacher()){ showToast("Only HR-001 can delete people"); return; }
  const normalized=normalizeAccessCode(code);
  if(normalized==="HR-001"){ showToast("HR-001 cannot be deleted"); return; }

  const ok=window.confirm("Delete access for "+(name||"this person")+"?\n\nTheir old Access Code will stop working.");
  if(!ok) return;

  const client=initSupabase();
  if(!client){ showToast("Supabase is not connected."); return; }

  const {error}=await client
    .from("class_access")
    .update({active:false})
    .eq("access_code",normalized)
    .eq("active",true);

  if(error){
    console.error(error);
    peopleStatus.textContent="Delete failed. Run the updated Supabase SQL policy below once.";
    showToast("Delete failed — Supabase policy needs update");
    return;
  }

  showToast("Access deleted. Old code is disabled.");
  peopleStatus.textContent=(name||"Account")+" access deleted.";
  await loadPeople();
  await loadTeacherOptions();
}

async function createManagedPerson(){
  if(!isCurrentTeacher()){ showToast("Only a teacher can manage people"); return; }
  const name=safeName(personNameInput.value.trim());
  if(!name || name==="Participant"){ peopleStatus.textContent="Enter a name first."; return; }
  const client=initSupabase();
  if(!client){ peopleStatus.textContent="Supabase is not connected."; return; }
  const code=randomAccessCode(peopleMode==="teacher"?"TCH":"STU");
  let room=ROOM_ID, teacherCode=null;
  if(peopleMode==="teacher"){
    room="haroon-quran-teacher-"+code.toLowerCase().replace(/[^a-z0-9]/g,"").slice(-6);
  }else{
    teacherCode=teacherSelect.value;
    const local=ROOM_ACCESS.teachers[teacherCode];
    if(local) room=local.room;
    else{
      const {data,error}=await client.from("class_access").select("room").eq("access_code",teacherCode).eq("role","teacher").eq("active",true).maybeSingle();
      if(error||!data){ peopleStatus.textContent="Selected teacher not found."; return; }
      room=data.room;
    }
  }
  const {error}=await client.from("class_access").insert({access_code:code,role:peopleMode,name,room,teacher_code:teacherCode,active:true});
  if(error){ peopleStatus.textContent="Could not save. Run the one-time Supabase SQL setup."; console.error(error); return; }
  generatedPersonDetails="Haroon Ibn Rasheed Online Quran Academy\n"+(peopleMode==="teacher"?"Teacher":"Student")+": "+name+"\nAccess Code: "+code+"\nUse the same website link to join your assigned classroom.";
  generatedPersonText.textContent=generatedPersonDetails;
  generatedPersonBox.style.display="block";
  peopleStatus.textContent="Created successfully.";
  await loadPeople();
  if(peopleMode==="student") await loadTeacherOptions();
}
managePeopleButton.addEventListener("click",()=>{
  if(!isAdminTeacher()){ showToast("Only HR-001 can manage people"); return; }
  peopleModal.classList.add("show"); peopleModal.setAttribute("aria-hidden","false"); setPeopleMode("student"); loadPeople();
});
peopleClose.addEventListener("click",()=>{peopleModal.classList.remove("show");peopleModal.setAttribute("aria-hidden","true");});
addTeacherTab.addEventListener("click",()=>setPeopleMode("teacher"));
addStudentTab.addEventListener("click",()=>setPeopleMode("student"));
generatePersonBtn.addEventListener("click",createManagedPerson);
copyPersonBtn.addEventListener("click",()=>navigator.clipboard?.writeText(generatedPersonDetails).then(()=>showToast("Details copied")));

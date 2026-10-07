
/* Keep mobile chat in the correct layer after orientation changes. */
window.addEventListener("resize",function(){
  const cp=document.querySelector(".chat");
  if(!cp) return;
  if(window.innerWidth>760 && cp.parentElement!==document.querySelector(".right")){
    const right=document.querySelector(".right");
    if(right) right.appendChild(cp);
    cp.classList.remove("mobile-chat-open"); cp.style.display="none";
  }
});

/*
ONE-TIME SUPABASE SQL:
create table if not exists public.class_access (
  access_code text primary key,
  role text not null check (role in ('teacher','student')),
  name text not null,
  room text not null,
  teacher_code text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.class_access enable row level security;
create policy "class_access_select" on public.class_access for select to anon using (active=true);
create policy "class_access_insert" on public.class_access for insert to anon with check (active=true);
drop policy if exists "class_access_update" on public.class_access;
create policy "class_access_update" on public.class_access
for update to anon
using (active=true)
with check (true);

insert into public.class_access(access_code,role,name,room,active) values
('HR-001','teacher','Haroon','haroon-quran-teacher-001',true),
('HR-002','teacher','Teacher 2','haroon-quran-teacher-002',true),
('HR-003','teacher','Teacher 3','haroon-quran-teacher-003',true),
('HR-004','teacher','Teacher 4','haroon-quran-teacher-004',true)
on conflict (access_code) do nothing;
*/


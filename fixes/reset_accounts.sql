-- Haroon Quran Classroom — account reset
-- This removes all old student/teacher accounts EXCEPT the required HR-001 bootstrap admin.
-- Run this in Supabase SQL Editor.
--
-- HR-001 is kept because the classroom's Manage People screen is protected by HR-001.
-- After this reset, create fresh teachers/students from Manage People.

delete from public.class_access
where access_code <> 'HR-001';

insert into public.class_access
  (access_code, role, name, room, teacher_code, active)
values
  ('HR-001', 'teacher', 'Haroon', 'haroon-quran-teacher-001', null, true)
on conflict (access_code) do update
set role = excluded.role,
    name = excluded.name,
    room = excluded.room,
    teacher_code = excluded.teacher_code,
    active = true;

-- Optional verification:
-- select access_code, role, name, room, teacher_code, active
-- from public.class_access
-- order by created_at;

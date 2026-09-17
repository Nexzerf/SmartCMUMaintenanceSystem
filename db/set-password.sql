-- Set or reset a user's password the safe way (run in Supabase → SQL Editor, as the postgres role).
--
-- IMPORTANT: never type a password straight into the users.password_hash column in the Table Editor.
-- The app compares with bcrypt, so a plain value there makes every login for that account fail.
-- These statements hash the password with bcrypt before storing it.

-- 1) One account
update "SmartCMU".users
set password_hash = extensions.crypt('PUT_THE_PASSWORD_HERE', extensions.gen_salt('bf', 10))
where username = 'admin01';

-- 2) Several accounts at once
-- update "SmartCMU".users
-- set password_hash = extensions.crypt('PUT_THE_PASSWORD_HERE', extensions.gen_salt('bf', 10))
-- where username in ('student02', 'student03');

-- 3) Add a new reporter account (technicians can be added from the admin UI instead)
-- insert into "SmartCMU".users (username, password_hash, role, full_name, user_type, faculty, phone, profile_completed)
-- values ('firstname.l', extensions.crypt('PUT_THE_PASSWORD_HERE', extensions.gen_salt('bf', 10)), 'reporter',
--         'ชื่อ นามสกุล', 'student', 'วิทยาลัยศิลปะ สื่อ และเทคโนโลยี (CAMT)', '0812345678', true);
-- Leave profile_completed = false to make the app ask for the profile and PDPA consent at first login.

-- 4) Check that every account has a real bcrypt hash (0 rows = all good)
-- select username from "SmartCMU".users where password_hash !~ '^\$2[aby]\$';

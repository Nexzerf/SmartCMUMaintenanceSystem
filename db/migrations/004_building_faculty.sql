-- Faculty or unit of a building: the reporter picks campus → faculty → building → floor → room.
alter table buildings add column if not exists faculty_th text;

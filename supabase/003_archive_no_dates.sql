-- Run after 002. Archived tasks are hidden from the board; dates are optional everywhere.
alter table tasks add column archived boolean not null default false;
alter table projects alter column start_date set default current_date;

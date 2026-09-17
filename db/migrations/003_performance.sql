-- Indexes for the queries every page runs.
create index if not exists requests_autoclose_idx on requests(completed_at) where status = 'completed';
create index if not exists request_followers_user_idx on request_followers(user_id);
create index if not exists notifications_unread_idx on notifications(user_id) where read_at is null;
create index if not exists requests_updated_idx on requests(updated_at desc);

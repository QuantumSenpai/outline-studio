DROP INDEX feedback_owner_date_idx;
CREATE INDEX feedback_owner_date_idx ON feedback(owner,created_at,id);

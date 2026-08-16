-- Live broadcast status: group sends into a campaign (batch) + remember the
-- message so stuck sends can be resumed and History can show pending→sending→sent.
ALTER TABLE public.course_digest_sends
  ADD COLUMN IF NOT EXISTS batch_id uuid,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS body text;

CREATE INDEX IF NOT EXISTS idx_course_digest_sends_batch
  ON public.course_digest_sends (batch_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_course_digest_sends_status
  ON public.course_digest_sends (status);

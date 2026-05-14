CREATE TABLE public.post (
  id            bigserial    PRIMARY KEY,
  slug          text         NOT NULL UNIQUE,
  title         text         NOT NULL DEFAULT '',
  description   text         NOT NULL DEFAULT '',
  date          timestamptz  NOT NULL,
  categories    text[]       NOT NULL DEFAULT '{}',
  content       text         NOT NULL DEFAULT '',
  thumbnail_url text,
  is_public     boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.post ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public posts are readable"
  ON public.post
  FOR SELECT
  USING (is_public = true);

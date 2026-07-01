
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read"  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- channels
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handle TEXT,
  description TEXT,
  country TEXT,
  subscribers BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channels TO authenticated;
GRANT ALL ON public.channels TO service_role;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own channels" ON public.channels FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- channel_metrics
CREATE TABLE public.channel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subscribers BIGINT DEFAULT 0,
  views BIGINT DEFAULT 0,
  watch_time_minutes BIGINT DEFAULT 0,
  UNIQUE (channel_id, date)
);
CREATE INDEX ON public.channel_metrics(channel_id, date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_metrics TO authenticated;
GRANT ALL ON public.channel_metrics TO service_role;
ALTER TABLE public.channel_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own channel metrics" ON public.channel_metrics FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.user_id = auth.uid()));

-- videos
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  external_id TEXT,
  title TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  avg_view_duration NUMERIC DEFAULT 0,
  category TEXT
);
CREATE INDEX ON public.videos(channel_id);
CREATE INDEX ON public.videos(channel_id, published_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own videos" ON public.videos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.user_id = auth.uid()));

-- keyword_metrics
CREATE TABLE public.keyword_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  ctr NUMERIC DEFAULT 0
);
CREATE INDEX ON public.keyword_metrics(channel_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.keyword_metrics TO authenticated;
GRANT ALL ON public.keyword_metrics TO service_role;
ALTER TABLE public.keyword_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own keyword metrics" ON public.keyword_metrics FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.user_id = auth.uid()));

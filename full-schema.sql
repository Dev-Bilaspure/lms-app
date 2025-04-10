-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create updated_at trigger for assets
CREATE TRIGGER assets_updated_at_trigger
BEFORE UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create Transcripts table
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT DEFAULT 'Untitled',
  response JSONB,
  status TEXT NOT NULL DEFAULT 'STARTED',
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

alter publication supabase_realtime
add table transcripts;


-- Create updated_at trigger for transcripts
CREATE TRIGGER transcripts_updated_at_trigger
BEFORE UPDATE ON transcripts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create Clips table
CREATE TABLE clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  start FLOAT NOT NULL,
  end FLOAT NOT NULL,
  transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create updated_at trigger for clips
CREATE TRIGGER clips_updated_at_trigger
BEFORE UPDATE ON clips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at(); 
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
  name TEXT, -- ALTER TABLE assets ADD COLUMN name TEXT;
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
  response JSONB NOT NULL,
  segments JSONB NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create updated_at trigger for transcripts
CREATE TRIGGER transcripts_updated_at_trigger
BEFORE UPDATE ON transcripts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at(); 
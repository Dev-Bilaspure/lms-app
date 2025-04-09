import { supabase } from "@/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { uploadFiles } from "./upload-files";
import { invokeWorkflow } from "./invoke-workflow";

export async function handleUpload(formData: FormData) {
  const { uploadedKeys, failedUploads } = await uploadFiles(formData);

  if (uploadedKeys.length === 0) {
    throw new Error("All uploads failed");
  }

  const assetsToUpload = uploadedKeys.map(({ bucket, key, name }) => ({
    bucket,
    key,
    name,
  }));

  const { data: assetsData, error: assetsError } = await supabase
    .from("assets")
    .insert(assetsToUpload)
    .select();

  if (assetsError)
    throw new Error(`Error inserting assets: ${JSON.stringify(assetsError)}`);

  const assetsDataWithUrls = assetsData.map((asset) => ({
    ...asset,
    url: uploadedKeys.find((u) => u.key === asset.key)?.url!,
  }));

  const transcripts = assetsData.map((asset) => ({
    id: uuidv4(),
    asset_id: asset.id,
  }));

  const { data: partialTranscriptsData, error: transcriptsError } =
    await supabase.from("transcripts").insert(transcripts).select();

  if (transcriptsError) {
    throw new Error(
      `Error inserting partial transcripts: ${JSON.stringify(transcriptsError)}`
    );
  }

  const { workflowId } = await invokeWorkflow({
    partialTranscripts: partialTranscriptsData,
    assetsData: assetsDataWithUrls as any,
  });

  return {
    success: true,
    workflowId
  };
}

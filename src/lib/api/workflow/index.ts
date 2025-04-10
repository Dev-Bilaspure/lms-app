import { supabase } from "@/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { invokeWorkflow } from "./invoke-workflow";
import { getDownloadPresignedUrl } from "@/lib/storage/s3";

export async function handleUpload(
  uploads: {
    fileName: string;
    key: string;
    bucket: string;
  }[]
) {
  if (uploads.length === 0) {
    throw new Error("All uploads failed");
  }

  const uploadsWithSignedUrls = await Promise.all(
    uploads.map(async (upload) => {
      const url = await getDownloadPresignedUrl(upload.key);
      return { ...upload, url };
    })
  );

  const assetsToUpload = uploadsWithSignedUrls.map(
    ({ bucket, key, fileName }) => ({
      bucket,
      key,
      name: fileName,
    })
  );

  const { data: assetsData, error: assetsError } = await supabase
    .from("assets")
    .insert(assetsToUpload)
    .select();

  if (assetsError)
    throw new Error(`Error inserting assets: ${JSON.stringify(assetsError)}`);

  const assetsDataWithUrls = assetsData.map((asset) => ({
    ...asset,
    url: uploadsWithSignedUrls.find((u) => u.key === asset.key)?.url!,
  }));

  const transcripts = assetsData.map((asset) => ({
    id: uuidv4(),
    asset_id: asset.id,
    title: asset.name,
    status: "TRANSCRIBING",
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
    workflowId,
    transcripts: partialTranscriptsData,
  };
}

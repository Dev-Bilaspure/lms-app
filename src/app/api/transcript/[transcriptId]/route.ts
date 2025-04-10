import { getDownloadPresignedUrl } from "@/lib/storage/s3";
import { supabase } from "@/supabase/client";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transcriptId: string }> }
) {
  try {
    const { transcriptId } = await params;

    if (!transcriptId) {
      return NextResponse.json(
        { error: "Missing transcriptId in request params" },
        { status: 400 }
      );
    }

    const { data: transcriptFetchData, error: transcriptFetchError } =
      await supabase
        .from("transcripts")
        .select("*")
        .eq("id", transcriptId)
        .single();

    if (transcriptFetchError || !transcriptFetchData) {
      return NextResponse.json(
        { error: `Error querying transcript: ${JSON.stringify(transcriptFetchError)}` },
        { status: 500 }
      );
    }

    const transcriptAssetId = transcriptFetchData.asset_id;

    const { data: transcriptAsset, error: transcriptAssetError } =
      await supabase
        .from("assets")
        .select("*")
        .eq("id", transcriptAssetId)
        .single();

    if (transcriptAssetError || !transcriptAsset) {
      return NextResponse.json(
        { error: `Error querying transcript asset: ${JSON.stringify(transcriptAssetError)}` },
        { status: 500 }
      );
    }

    const asset_url = await getDownloadPresignedUrl(transcriptAsset.key);

    const { data: clipsFetchData, error: clipsFetchError } = await supabase
      .from("clips")
      .select("*")
      .eq("transcript_id", transcriptId);

    if (clipsFetchError || !clipsFetchData) {
      return NextResponse.json(
        { error: `Error querying clips: ${JSON.stringify(clipsFetchError)}` },
        { status: 500}
      );
    }

    const transcriptClips = await Promise.all(
      clipsFetchData.map(async (clip) => {
        const clipAsset = await getDownloadPresignedUrl(clip.asset_id);
        return {
          ...clip,
          ...((clip.meta as object) || {}),
          asset_url: clipAsset,
        };
      })
    );

    const transcriptResponse = {
      ...transcriptFetchData,
      asset_url,
      clips: transcriptClips,
    };

    return NextResponse.json(transcriptResponse, { status: 200 });
  } catch (error) {
    console.error("Error quering from workflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

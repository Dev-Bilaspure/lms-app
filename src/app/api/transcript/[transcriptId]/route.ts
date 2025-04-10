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
        .select(
          `
          *,
          clips (
            *,
            asset_id,
            assets (
              *
            )
          ),
          assets (
            *
          )
        `
        )
        .eq("id", transcriptId)
        .single();

    if (transcriptFetchError || !transcriptFetchData) {
      return NextResponse.json(
        {
          error: `Error querying transcript: ${JSON.stringify(
            transcriptFetchError
          )}`,
        },
        { status: 500 }
      );
    }

    const transcriptAssetUrl = await getDownloadPresignedUrl(
      transcriptFetchData.assets.key
    );

    const transcriptResponse = {
      id: transcriptFetchData.id,
      asset_url: transcriptAssetUrl,
      response: transcriptFetchData.response,
      status: transcriptFetchData.status,
      title: transcriptFetchData.title,
      asset_id: transcriptFetchData.assets.id,
      created_at: transcriptFetchData.created_at,
      updated_at: transcriptFetchData.updated_at,
      clips: await Promise.all(
        transcriptFetchData.clips.map(async (clip) => {
          const clipAssetUrl = await getDownloadPresignedUrl(clip.assets.key);
          return {
            ...(clip.meta as any),
            id: clip.id,
            start: clip.start,
            end: clip.end,
            transcript_id: clip.transcript_id,
            created_at: clip.created_at,
            updated_at: clip.updated_at,
            asset_url: clipAssetUrl,
          };
        })
      ),
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

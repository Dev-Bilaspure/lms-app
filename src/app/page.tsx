"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, UploadCloud, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { startWorkflow } from "@/lib/utils/fetch"; // Assuming startWorkflow handles API call
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Placeholder data - replace with actual API call

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acceptedFilesState, setAcceptedFilesState] = useState<File[]>([]);
  const [transcripts, setTranscripts] = useState<
    { id: string; title: string; created_at: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("transcripts")
        .select("id, title, created_at");
      if (error || !data) {
        console.error("Error fetching transcripts:", error);
        return;
      }
      setTranscripts(data as any);
    })();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }
    setAcceptedFilesState(acceptedFiles); // Keep track of files for potential immediate upload
    setErrorMessage(null);
    setUploadResult(null);

    // Immediately trigger upload
    await handleUpload(acceptedFiles);
  }, []);

  const handleUpload = async (files: File[]) => {
    if (!files?.length) return;

    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          // Step 1: Get presigned URL
          const res = await fetch("/api/s3/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
            }),
          });

          if (!res.ok)
            throw new Error(`Failed to get upload URL for ${file.name}`);

          const { url, key, bucket } = await res.json();

          // Step 2: Upload to S3
          const uploadRes = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);

          console.log({ url, key }, "✅ Uploaded:", file.name);

          return { fileName: file.name, key, bucket };
        })
      );

      const { workflowId, transcripts } = await startWorkflow(uploads);

      setTranscripts((prev) => [...transcripts, ...prev]);

      return uploads;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isFocused,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
      "audio/*": [".mp3", ".wav", ".aac", ".ogg", ".flac"],
    },
    maxSize: 200 * 1024 * 1024, // 200MB
    multiple: true,
  });

  const style = useMemo(
    () =>
      cn(
        "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out",
        "bg-card hover:bg-accent/50 border-border",
        isFocused &&
          "outline-none ring-2 ring-ring ring-offset-2 ring-offset-background",
        isDragAccept && "border-green-500 bg-green-500/10",
        isDragReject && "border-destructive bg-destructive/10",
        isDragActive && "border-primary"
      ),
    [isFocused, isDragActive, isDragAccept, isDragReject]
  );

  // Use mock data for now

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Upload Area */}
      <div className="mb-12">
        <div {...getRootProps({ className: style })}>
          <input {...getInputProps()} />
          <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-muted-foreground">Drop the files here ...</p>
          ) : (
            <p className="text-muted-foreground text-center">
              Drag & drop some files here, or click to select files
              <br />
              <span className="text-xs">(Max 200MB per file)</span>
            </p>
          )}
          {acceptedFilesState.length > 0 && !isUploading && (
            <div className="mt-4 text-sm text-muted-foreground">
              Selected: {acceptedFilesState.map((f) => f.name).join(", ")}
              {/* <Button size="sm" variant="ghost" onClick={() => handleUpload(acceptedFilesState)} className="ml-2">Upload</Button> */}
            </div>
          )}
        </div>
        {isUploading && (
          <div className="mt-4 text-center text-primary">Uploading...</div>
        )}
        {errorMessage && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {errorMessage}
          </div>
        )}
        {uploadResult?.success && (
          <div className="mt-4 p-3 bg-green-500/10 text-green-700 rounded-md text-sm">
            Upload successful! Workflow started with ID:{" "}
            {uploadResult.workflowId}
          </div>
        )}
      </div>

      {/* Transcript List */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Projects</h2>
        {transcripts.length === 0 && !isUploading ? (
          <EmptyState message="No projects yet. Upload a video or audio file to get started." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {transcripts.map((transcript) => (
              <div key={transcript.id} className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await supabase
                            .from("transcripts")
                            .delete()
                            .eq("id", transcript.id);
                          setTranscripts(
                            transcripts.filter((t) => t.id !== transcript.id)
                          );
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link href={`/project/${transcript.id}`} passHref>
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer bg-card border-border">
                    <CardContent className="flex-grow flex flex-col items-center justify-center p-6">
                      <Video className="w-16 h-16 text-muted-foreground mb-4" />
                      <p className="text-sm font-medium text-center text-card-foreground mb-1 leading-tight">
                        {transcript.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transcript.created_at).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Placeholder data - replace with actual API call

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [acceptedFilesState, setAcceptedFilesState] = useState<File[]>([]);
  const [transcripts, setTranscripts] = useState<
    { id: string; title: string; created_at: string; status: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("transcripts")
        .select("id, title, created_at, status");
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

    // Immediately trigger upload
    await handleUpload(acceptedFiles);
  }, []);

  const handleUpload = async (files: File[]) => {
    if (!files?.length) return;

    setIsUploading(true);
    const toastId = toast.loading("Preparing to upload files...");

    try {
      const uploads = await Promise.all(
        files.map(async (file, index) => {
          // Update progress for each file
          toast.loading(`Uploading ${file.name}...`, { id: toastId });

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

      toast.loading("Processing files...", { id: toastId });
      const { workflowId, transcripts: newTranscripts } = await startWorkflow(
        uploads
      );

      // Add status to new transcripts and add them to state
      const transcriptsWithStatus = newTranscripts.map((transcript: any) => ({
        ...transcript,
        status: "STARTED",
      }));

      setTranscripts((prev) => [...transcriptsWithStatus, ...prev]);
      setIsUploading(false);
      setAcceptedFilesState([]);

      toast.success("Files uploaded successfully! Processing started.", {
        id: toastId,
      });
      return uploads;
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      toast.error(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { id: toastId }
      );
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
    disabled: isUploading,
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
        isDragActive && "border-primary",
        isUploading && "opacity-50 cursor-not-allowed"
      ),
    [isFocused, isDragActive, isDragAccept, isDragReject, isUploading]
  );

  return (
    <>
      <Navbar viewMode="transcript" onViewModeChange={() => {}} />
      <div className="container mx-auto px-4 py-8">
        {/* Upload Area */}
        <div className="mb-12">
          <div {...getRootProps({ className: style })}>
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                {isDragActive ? (
                  <p className="text-muted-foreground">
                    Drop the files here ...
                  </p>
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
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Transcript List */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Projects</h2>
          {transcripts.length === 0 && !isUploading ? (
            <EmptyState message="No projects yet. Upload a video or audio file to get started." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {transcripts.map((transcript) => {
                const isProcessing = transcript.status === "STARTED";
                return (
                  <div key={transcript.id} className="relative">
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={isProcessing}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-full",
                              isProcessing && "opacity-50 cursor-not-allowed"
                            )}
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
                                transcripts.filter(
                                  (t) => t.id !== transcript.id
                                )
                              );
                              toast.success("Project deleted successfully");
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Link
                      href={isProcessing ? "#" : `/project/${transcript.id}`}
                      passHref
                      onClick={(e) => isProcessing && e.preventDefault()}
                      className={cn(isProcessing && "cursor-not-allowed")}
                    >
                      <Card
                        className={cn(
                          "h-full flex flex-col transition-shadow bg-card border-border",
                          !isProcessing && "hover:shadow-lg cursor-pointer",
                          isProcessing && "opacity-80"
                        )}
                      >
                        <CardContent className="flex-grow flex flex-col items-center justify-center p-6">
                          <Video className="w-16 h-16 text-muted-foreground mb-4" />
                          <p className="text-sm font-medium text-center text-card-foreground mb-1 leading-tight">
                            {transcript.title}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
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
                          {isProcessing && (
                            <div className="flex items-center mt-2">
                              <div className="w-3 h-3 mr-2 bg-amber-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-amber-500 font-medium">
                                Processing
                              </span>
                            </div>
                          )}
                          {transcript.status === "DONE" && (
                            <div className="flex items-center mt-2">
                              <div className="w-3 h-3 mr-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-500 font-medium">
                                Ready
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

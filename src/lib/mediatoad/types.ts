//
// Task Status
//
export type TaskStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "DONE";

//
// OnFailure
//
export type OnFailure = {
  /**
   * Optional instructions on what to do if task fails.
   */
  action?: "FAIL_WORKFLOW";
};

//
// Notification
//
export type Notification = {
  /**
   * Webhook URL for task-level notifications.
   */
  url?: string;
};

//
// Base Task
//
export type BaseTask = {
  /**
   * Type of operation to perform.
   */
  operation: string;
  /**
   * Unique identifier for the task.
   */
  id?: string;
  /**
   * Notification configuration for the task.
   */
  notify?: Notification;
  /**
   * Name of the output asset.
   */
  outputAsset?: string;
  /**
   * Optional instructions on what to do if task fails.
   */
  onFailure?: OnFailure;
};

//
// Common Task State Fields
//
export type CommonTaskStateFields = {
  /**
   * Status of the task.
   */
  status: TaskStatus;
  /**
   * Start time of the task in milliseconds.
   */
  startTime?: number | null;
  /**
   * End time of the task in milliseconds.
   */
  endTime?: number | null;
  /**
   * Duration of the task in milliseconds.
   */
  duration?: number | null;
  /**
   * Duration in a human-readable format.
   */
  durationHumanReadable?: string | null;
  /**
   * Completion percent.
   */
  percentage: number;
  /**
   * Storage bucket.
   */
  Bucket?: string | null;
  /**
   * Storage key/path.
   */
  Key?: string | null;
  /**
   * Size of the output file in bytes.
   */
  fileSize?: number | null;
  /**
   * Size in a human-readable format.
   */
  fileSizeHumanReadable?: string | null;
  /**
   * Type of storage used.
   */
  storageType?: string | null;
  /**
   * URL to access the output file.
   */
  url?: string | null;
  /**
   * Error message if the task failed.
   */
  error?: string | null;
  /**
   * Indicates if this task caused the entire workflow to fail.
   */
  workflowFailed?: boolean;
};

//
// Scenes Fields
//
export type ScenesFields = {
  /**
   * List of scene timestamps.
   */
  scenes?: number[];
};

//
// Thumbnails Fields
//
export type ThumbnailsFields = {
  thumbnails?: {
    Bucket: string;
    Key: string;
    url: string;
    fileSize: number;
    timestamp: number;
  }[];
};

//
// Encode Task
//
export type EncodeTask = BaseTask & {
  operation: "encode";
  /**
   * Name of the asset.
   */
  asset: string;
  /**
   * Encoding preset.
   */
  preset: string;
};

export type EncodeTaskState = EncodeTask & CommonTaskStateFields;

//
// Scenes Task
//
export type ScenesTask = BaseTask & {
  operation: "scenes";
  asset: string;
  threshold?: number;
  thumbnails?: {
    size?: string;
  };
  writeFile?: boolean;
};

export type ScenesTaskState = ScenesTask & CommonTaskStateFields & ScenesFields;

//
// Thumbnails Task
//
export type ThumbnailsTask = BaseTask & {
  operation: "thumbnails";
  asset: string;
  /**
   * Array of timestamps (seconds) or the name of an asset containing a JSON array of timestamps.
   */
  timestamps?: number[] | string;
  size?: string;
};

export type ThumbnailsTaskState = ThumbnailsTask &
  CommonTaskStateFields &
  ThumbnailsFields;

//
// Merge Task
//
export type MergeTask = BaseTask & {
  operation: "merge";
  videoAsset: string;
  audioAsset: string;
};

export type MergeTaskState = MergeTask & CommonTaskStateFields;

//
// Clip Task
//
export type ClipTask = BaseTask & {
  operation: "clip";
  asset?: string;
  start?: number;
  end?: number;
  type?: "audio" | "video";
  segmentsAsset?: string;
  batchClip?: boolean;
};

export type BatchClip = {
  Bucket: string;
  Key: string;
  url: string;
  fileSize: number;
  start: number;
  end: number;
  duration: number;
  transcriptText?: string;
  briefSegmentDescription?: string;
  viralityScore?: number;
  viralScoreExplanation?: string;
};

export type ClipTaskState = ClipTask &
  CommonTaskStateFields & {
    batchClips?: BatchClip[];
  };

//
// YouTube Resolution
//
export type YouTubeResolution =
  | "highest-available"
  | "lowest-available"
  | "1080p"
  | "720p"
  | "480p"
  | "360p"
  | "240p";

//
// Download Provider
//
export type DownloadProvider = "rapidapi" | "sieve";

//
// Download Task
//
export type DownloadTask = BaseTask & {
  operation: "download";
  url?: string;
  asset?: string;
  outputAsset?: string;
  serviceUrl?: string;
  Bucket?: string;
  Key?: string;
  resolution?: YouTubeResolution;
  provider?: DownloadProvider;
  sieveAPIKey?: string;
  rapidAPIKey?: string;
};

export type DownloadTaskState = DownloadTask & CommonTaskStateFields;

//
// Object Detection Task
//
export type ObjectDetectionTask = BaseTask & {
  operation: "object-detection";
  asset: string;
  provider?: string;
  serviceUrl?: string;
};

export type ObjectDetectionTaskState = ObjectDetectionTask &
  CommonTaskStateFields;

//
// Transcription Task
//
export type TranscriptionTask = BaseTask & {
  operation: "transcription";
  asset: string;
  provider?: "deepgram" | "assemblyai";
  serviceUrl?: string;
  language?: string;
  apiKey?: string;
};

export type TranscriptionTaskState = TranscriptionTask &
  CommonTaskStateFields & {
    data?: any;
  };

//
// Segmentation Task
//
export type SegmentationTask = BaseTask & {
  operation: "segmentation";
  asset: string;
  clipLength?: number;
  model?: string;
  /**
   * Optional mock data array for testing segments.
   */
  mockData?: any[];
};

export type SegmentationTaskState = SegmentationTask &
  CommonTaskStateFields & {
    data?: any;
  };

//
// Service Call Task
//
export type ServiceCallTask = BaseTask & {
  operation: "service-call";
  asset: string;
  /**
   * External service endpoint.
   */
  serviceUrl: string;
  /**
   * Optional HTTP method.
   */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /**
   * Optional HTTP headers.
   */
  headers?: Record<string, string>;
  /**
   * Optional JSON body data.
   */
  data?: Record<string, any>;
};

export type ServiceCallTaskState = ServiceCallTask &
  CommonTaskStateFields & {
    responseData?: any;
  };

//
// Dubbing Task
//
export type DubbingTask = BaseTask & {
  operation: "dubbing";
  asset: string;
  targetUrl: string;
  provider?: string;
  serviceUrl?: string;
  targetLanguage: string;
  translationEngine?: string;
  voiceEngine?: string;
  transcriptionEngine?: string;
  outputMode?: string;
  returnTranscript?: boolean;
  preserveBackgroundAudio?: boolean;
  safewords?: string;
  translationDictionary?: string;
  start?: number;
  end?: number;
  enableLipsyncing?: boolean;
  lipsyncBackend?: string;
  lipsyncEnhance?: string;
  editSegments?: any[];
  outputAsset?: string;
};

export type DubbingTaskState = DubbingTask & CommonTaskStateFields;

//
// Unified Task Unions
//
export type Task =
  | EncodeTask
  | ScenesTask
  | ThumbnailsTask
  | MergeTask
  | ClipTask
  | DownloadTask
  | ObjectDetectionTask
  | TranscriptionTask
  | SegmentationTask
  | ServiceCallTask
  | DubbingTask;

export type TaskState =
  | EncodeTaskState
  | ScenesTaskState
  | ThumbnailsTaskState
  | MergeTaskState
  | ClipTaskState
  | DownloadTaskState
  | ObjectDetectionTaskState
  | TranscriptionTaskState
  | SegmentationTaskState
  | ServiceCallTaskState
  | DubbingTaskState;

//
// MediaJobParams
//
export type Asset = {
  name: string;
  url: string;
  urlType?: "s3" | "azure" | "url";
};

export type Storage = {
  bucket?: string;
  base?: string;
  storageType?: "s3" | "azure";
};

export type MediaJobParams = {
  /**
   * Collection of assets used by tasks in this media job.
   */
  assets: Asset[];
  /**
   * List of tasks to be performed in this media job.
   */
  tasks: Task[];
  /**
   * Optional storage configuration.
   */
  storage?: Storage;
  /**
   * Optional notification settings.
   */
  notify?: Notification;
  /**
   * Optional job identifier.
   */
  jobId?: string;
  /**
   * Optional queue name.
   */
  queue?: string;
  /**
   * Optional job type.
   */
  type?: string;
  /**
   * Optional external job identifier.
   */
  externalId?: string;
};

//
// Job Status
//
export type JobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "DONE";

//
// Job Details
//
export type JobDetails = {
  /**
   * Unique job identifier.
   */
  jobId: string;
  /**
   * Current status of the job.
   */
  status: JobStatus;
  /**
   * State of tasks under this job.
   */
  tasks: TaskState[];
  /**
   * Timestamp for when this job was created (ISO string).
   */
  createdAt?: string;
  /**
   * Timestamp for when this job was last updated (ISO string).
   */
  updatedAt?: string;
};

export type MediaJobNotifiedParams = {
  jobId: string;
  jobConfig: MediaJobParams;
  tasks: TaskState[];
  notifyStatus: "SUCCESS" | "FAILED" | null;
  status: JobStatus;
  statusHistory: Array<{ status: string; timestamp: number }>;
  notify: Notification;
  assets?: Asset[];
  storage?: Storage;
};

export type MediaTaskNotifiedParams = {
  jobId: string;
  tasks: TaskState[];
  status: TaskStatus;
  statusHistory: Array<{ status: string; timestamp: number }>;
  jobConfig: MediaJobParams;
  notify: Notification;
  taskId: string;
  taskConfig: Task;
  task: TaskState;
  notifyStatus: "SUCCESS" | "FAILED" | null;
};

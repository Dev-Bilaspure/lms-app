'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
      setUploadResult(null);
      setErrorMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setErrorMessage('Please select at least one file to upload');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadResult(null);

    try {
      // Create a FormData object to send the files
      const formData = new FormData();
      
      // Append all selected files to the FormData object
      Array.from(files).forEach((file, index) => {
        formData.append(`file-${index}`, file);
      });

      // Send the request to the API endpoint
      const response = await fetch('/api/workflow', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - the browser will set it with the boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
      
      // Clear the selected files
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFiles(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFiles(null);
    setUploadResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">File Upload Example</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Select Files (Max 200MB per file)
          </label>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file" 
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
          />
        </div>

        {files && files.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
            <ul className="list-disc pl-5">
              {Array.from(files).map((file, index) => (
                <li key={index} className="text-sm text-gray-600">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex space-x-4">
          <button 
            onClick={handleUpload}
            disabled={isUploading || !files}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isUploading || !files 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>

          <button 
            onClick={resetForm}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}

        {uploadResult && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Upload Result:</h3>
            <div className="p-3 bg-green-100 text-green-800 rounded-md">
              {uploadResult.success && (
                <p className="font-medium">Files uploaded successfully!</p>
              )}

              {uploadResult.warning && (
                <p className="text-yellow-700 mt-1">{uploadResult.warning}</p>
              )}

              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Uploaded files:</p>
                <ul className="list-disc pl-5">
                  {uploadResult?.uploads?.map((file: any, index: number) => (
                    <li key={index} className="text-sm">
                      {file.originalFilename} (Key: {file.Key})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

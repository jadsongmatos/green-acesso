'use client';

import Uppy, { UppyFile } from '@uppy/core';
import Dashboard from '@uppy/react/lib/Dashboard';
import Tus from '@uppy/tus';
import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useUppy } from '@/contexts/UppyContext';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

function createUppy() {
  return new Uppy().use(Tus, { endpoint: '/api/upload' });
}

export default function UppyDashboard() {
  const theme = useTheme();
  const [uppy] = useState(createUppy);
  const { addFile } = useUppy();

  useEffect(() => {
    const handleUploadSuccess = (
      file: UppyFile<Record<string, unknown>, Record<string, unknown>> | undefined,
      response: { status: number; body?: Record<string, never>; uploadURL?: string; bytesUploaded?: number }
    ) => {
      if (file && response.uploadURL) {
        console.log('File uploaded successfully:', file,response.uploadURL);
        const url_obj = new URL(response.uploadURL);
        const path_parts = url_obj.pathname.split("/")
        const upload_id = path_parts[path_parts.length - 1];

        addFile({
          id: upload_id,
          name: file.name ?? '',
          url: response.uploadURL,
          size: file.size ?? -1,
          type: file.type,
          status: 'pending',
        });
      }
    };

    uppy.on('upload-success', handleUploadSuccess);
    return () => {
      uppy.off('upload-success', handleUploadSuccess);
    };
  }, [uppy, addFile]);

  return (
    <Dashboard 
      theme={theme.palette.mode} 
      uppy={uppy}
    />
  );
}
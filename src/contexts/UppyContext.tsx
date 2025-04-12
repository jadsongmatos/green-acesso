"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface UppyContextType {
  files: UploadedFile[];
  addFile: (file: Omit<UploadedFile, "uploadedAt">) => void;
  removeFile: (id: string) => void;
  processFile: (fileId: string) => Promise<void>;
}

const UppyContext = createContext<UppyContextType | undefined>(undefined);

export function UppyProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    const savedFiles = localStorage.getItem("uppyFiles");
    if (savedFiles) {
      setFiles(JSON.parse(savedFiles));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("uppyFiles", JSON.stringify(files));
  }, [files]);

  const addFile = (file: Omit<UploadedFile, "uploadedAt" | "status">) => {
    const newFile = {
      ...file,
      uploadedAt: new Date().toISOString(),
      status: 'pending' as const,
    };
    setFiles((prev) => [...prev, newFile]);
  };

  const updateFileStatus = (fileId: string, status: UploadedFile['status']) => {
    setFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, status } : file
      )
    );
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const processFile = async (fileId: string) => {
    try {
      updateFileStatus(fileId, 'processing');
      
      const response = await fetch("/api/p/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        updateFileStatus(fileId, 'error');
        throw new Error("Failed to process file");
      }

      updateFileStatus(fileId, 'completed');
      return await response.json();
    } catch (error) {
      updateFileStatus(fileId, 'error');
      console.error("Error processing file:", error);
      throw error;
    }
  };


  return (
    <UppyContext.Provider value={{ files, addFile, removeFile, processFile }}>
      {children}
    </UppyContext.Provider>
  );
}

export function useUppy() {
  const context = useContext(UppyContext);
  if (!context) {
    throw new Error("useUppy must be used within a UppyProvider");
  }
  return context;
}

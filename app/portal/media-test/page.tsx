"use client";

import { useState } from "react";
import { MediaUpload } from "@/app/components/media/MediaUpload";
import { MediaDisplay } from "@/app/components/media/MediaDisplay";

export default function MediaTestPage() {
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<string[]>([]);

  const handleUploadComplete = (media: any) => {
    console.log("Upload complete:", media);
    const mediaId = typeof media === 'string' ? media : media.id;
    setUploadedMediaId(mediaId);
    setMediaList((prev) => [...prev, mediaId]);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">
        Teste de Processamento de Mídia
      </h1>

      {/* Upload Section */}
      <div className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Upload de Mídia</h2>
        <MediaUpload
          onUploadComplete={handleUploadComplete}
          onUploadError={(error) => console.error("Upload error:", error)}
        />
      </div>

      {/* Display Last Uploaded */}
      {uploadedMediaId && (
        <div className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Última Mídia Enviada (ID: {uploadedMediaId})
          </h2>
          <div className="max-w-md mx-auto">
            <MediaDisplay 
              mediaId={uploadedMediaId} 
              context="modal"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Display All Uploaded Media */}
      {mediaList.length > 0 && (
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Todas as Mídias Enviadas ({mediaList.length})
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {mediaList.map((mediaId) => (
              <div key={mediaId} className="border rounded p-2">
                <p className="text-xs text-gray-500 mb-2">ID: {mediaId}</p>
                <MediaDisplay mediaId={mediaId} context="grid" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">Como testar:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Faça upload de uma imagem (JPEG, PNG, WebP ou GIF até 100MB)</li>
          <li>Aguarde o processamento (status muda de "processing" para "ready")</li>
          <li>Verifique as variantes geradas no console do worker</li>
          <li>Teste também com vídeo (MP4, MOV, AVI ou WebM até 500MB)</li>
        </ol>
      </div>
    </div>
  );
}

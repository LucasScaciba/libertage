import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IconPhoto, IconVideo } from "@tabler/icons-react";
import Image from "next/image";

interface MediaView {
  media_id: string;
  thumbnail_url: string;
  filename: string;
  media_type: "image" | "video";
  view_count: number;
}

interface MediaViewsIndicatorProps {
  data: MediaView[];
}

function truncateFilename(filename: string | null | undefined, maxLength: number = 30): string {
  if (!filename) {
    return "Sem nome";
  }
  if (filename.length <= maxLength) {
    return filename;
  }
  return filename.substring(0, maxLength) + "...";
}

export default function MediaViewsIndicator({ data }: MediaViewsIndicatorProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mídias Mais Visualizadas</CardTitle>
          <CardDescription>Fotos e vídeos com mais visualizações</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado disponível ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mídias Mais Visualizadas</CardTitle>
        <CardDescription>Top 3 fotos e vídeos</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Mídia</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead className="w-24">Tipo</TableHead>
              <TableHead className="text-right w-24">Visualizações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 3).map((media) => (
              <TableRow key={media.media_id}>
                <TableCell>
                  <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100">
                    {media.thumbnail_url ? (
                      media.media_type === "image" ? (
                        <Image
                          src={media.thumbnail_url}
                          alt={media.filename || "Mídia"}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <Image
                            src={media.thumbnail_url}
                            alt={media.filename || "Vídeo"}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <IconVideo className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        {media.media_type === "image" ? (
                          <IconPhoto className="h-6 w-6 text-gray-400" />
                        ) : (
                          <IconVideo className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <span className="text-sm" title={media.filename || undefined}>
                    {truncateFilename(media.filename)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1">
                    {media.media_type === "image" ? (
                      <>
                        <IconPhoto className="h-3 w-3" />
                        Foto
                      </>
                    ) : (
                      <>
                        <IconVideo className="h-3 w-3" />
                        Vídeo
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {media.view_count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

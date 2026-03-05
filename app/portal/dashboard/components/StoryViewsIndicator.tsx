import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconVideo } from "@tabler/icons-react";
import Image from "next/image";

interface StoryView {
  story_id: string;
  thumbnail_url: string;
  video_url: string;
  view_count: number;
}

interface StoryViewsIndicatorProps {
  data: StoryView[];
}

function getStoryLabel(storyId: string): string {
  return `Story ${storyId.substring(0, 8)}`;
}

export default function StoryViewsIndicator({ data }: StoryViewsIndicatorProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stories Mais Visualizados</CardTitle>
          <CardDescription>Stories com mais visualizações</CardDescription>
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
        <CardTitle>Stories Mais Visualizados</CardTitle>
        <CardDescription>Top 3 stories</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Story</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead className="text-right w-24">Visualizações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((story) => (
              <TableRow key={story.story_id}>
                <TableCell>
                  <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100">
                    {story.thumbnail_url ? (
                      <Image
                        src={story.thumbnail_url}
                        alt={getStoryLabel(story.story_id)}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <IconVideo className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <IconVideo className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <span className="text-sm">
                    {getStoryLabel(story.story_id)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {story.view_count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

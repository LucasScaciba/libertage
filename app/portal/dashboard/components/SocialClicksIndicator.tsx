import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  IconBrandInstagram, 
  IconBrandTiktok, 
  IconBrandYoutube, 
  IconBrandFacebook,
  IconBrandOnlyfans,
  IconBrandPatreon,
  IconDiamond,
  IconHeart,
  IconMovie,
  IconLink
} from "@tabler/icons-react";

interface SocialClick {
  social_network: string;
  click_count: number;
}

interface SocialClicksIndicatorProps {
  data: SocialClick[];
}

// Reuse the same icon mapping from ExternalLinksDisplay
const getSocialIcon = (title: string) => {
  const iconMap: Record<string, any> = {
    'Instagram': IconBrandInstagram,
    'Tiktok': IconBrandTiktok,
    'Youtube': IconBrandYoutube,
    'Facebook': IconBrandFacebook,
    'Onlyfans': IconBrandOnlyfans,
    'Patreon': IconBrandPatreon,
    'Privacy': IconDiamond,
    'Fansly': IconHeart,
    'Canal Adulto': IconMovie,
  };
  
  return iconMap[title] || IconLink;
};

export default function SocialClicksIndicator({ data }: SocialClicksIndicatorProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cliques nas Redes Sociais</CardTitle>
          <CardDescription>Redes sociais mais acessadas</CardDescription>
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
        <CardTitle>Cliques nas Redes Sociais</CardTitle>
        <CardDescription>Redes mais acessadas pelos visitantes</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Rede Social</TableHead>
              <TableHead className="text-right">Cliques</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((social) => {
              const IconComponent = getSocialIcon(social.social_network);
              
              return (
                <TableRow key={social.social_network}>
                  <TableCell>
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                      <IconComponent className="h-4 w-4 text-gray-700" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {social.social_network}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {social.click_count}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconBrandWhatsapp, IconBrandTelegram } from "@tabler/icons-react";

interface ContactChannel {
  channel: "whatsapp" | "telegram";
  contact_count: number;
}

interface ContactChannelsIndicatorProps {
  data: ContactChannel[];
}

const getChannelConfig = (channel: string) => {
  const configs = {
    whatsapp: {
      name: "WhatsApp",
      icon: IconBrandWhatsapp,
      color: "text-green-600",
    },
    telegram: {
      name: "Telegram",
      icon: IconBrandTelegram,
      color: "text-blue-600",
    },
  };

  return configs[channel as keyof typeof configs] || {
    name: channel,
    icon: IconBrandWhatsapp,
    color: "text-gray-600",
  };
};

export default function ContactChannelsIndicator({ data }: ContactChannelsIndicatorProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contatos por Canal</CardTitle>
          <CardDescription>Métodos de contato mais utilizados</CardDescription>
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
        <CardTitle>Contatos por Canal</CardTitle>
        <CardDescription>Métodos de contato mais utilizados</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Canal</TableHead>
              <TableHead className="text-right">Contatos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((channel) => {
              const config = getChannelConfig(channel.channel);
              const IconComponent = config.icon;

              return (
                <TableRow key={channel.channel}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <IconComponent className={`h-5 w-5 ${config.color}`} />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {config.name}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {channel.contact_count}
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

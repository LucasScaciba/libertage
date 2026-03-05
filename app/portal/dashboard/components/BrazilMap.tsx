"use client";

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BrazilMapProps {
  visitsByState: Record<string, number>;
}

const BRAZILIAN_STATES = {
  'AC': 'Acre',
  'AL': 'Alagoas',
  'AP': 'Amapá',
  'AM': 'Amazonas',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins'
};

// Simplified Brazil map SVG paths (state codes as IDs)
const STATE_PATHS: Record<string, string> = {
  'AC': 'M 50 200 L 100 180 L 120 220 L 80 240 Z',
  'AL': 'M 520 280 L 540 270 L 550 290 L 530 300 Z',
  'AP': 'M 280 80 L 310 70 L 320 100 L 290 110 Z',
  'AM': 'M 100 150 L 200 130 L 220 180 L 120 200 Z',
  'BA': 'M 450 300 L 520 280 L 530 350 L 460 370 Z',
  'CE': 'M 500 220 L 540 210 L 550 240 L 510 250 Z',
  'DF': 'M 420 340 L 440 335 L 445 350 L 425 355 Z',
  'ES': 'M 480 380 L 500 375 L 505 395 L 485 400 Z',
  'GO': 'M 400 320 L 450 310 L 460 360 L 410 370 Z',
  'MA': 'M 450 200 L 500 190 L 510 230 L 460 240 Z',
  'MT': 'M 300 280 L 380 270 L 390 330 L 310 340 Z',
  'MS': 'M 340 380 L 400 370 L 410 420 L 350 430 Z',
  'MG': 'M 420 360 L 480 350 L 490 400 L 430 410 Z',
  'PA': 'M 280 180 L 380 170 L 390 220 L 290 230 Z',
  'PB': 'M 530 250 L 550 245 L 555 265 L 535 270 Z',
  'PR': 'M 380 420 L 430 410 L 440 450 L 390 460 Z',
  'PE': 'M 510 260 L 540 255 L 545 280 L 515 285 Z',
  'PI': 'M 460 240 L 500 230 L 510 270 L 470 280 Z',
  'RJ': 'M 470 400 L 490 395 L 495 415 L 475 420 Z',
  'RN': 'M 520 240 L 545 235 L 550 255 L 525 260 Z',
  'RS': 'M 360 470 L 410 460 L 420 510 L 370 520 Z',
  'RO': 'M 250 280 L 300 270 L 310 310 L 260 320 Z',
  'RR': 'M 200 80 L 250 70 L 260 110 L 210 120 Z',
  'SC': 'M 380 450 L 420 440 L 430 480 L 390 490 Z',
  'SP': 'M 410 400 L 460 390 L 470 430 L 420 440 Z',
  'SE': 'M 520 290 L 540 285 L 545 305 L 525 310 Z',
  'TO': 'M 400 260 L 440 250 L 450 290 L 410 300 Z',
};

function calculateStateColor(visits: number, maxVisits: number): string {
  if (visits === 0) return '#f3f4f6'; // gray-100
  
  const intensity = visits / maxVisits;
  const grayValue = Math.floor(255 - (intensity * 155)); // 255 to 100
  
  return `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
}

export default function BrazilMap({ visitsByState }: BrazilMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Calculate max visits for color scaling
  const maxVisits = Math.max(...Object.values(visitsByState), 1);

  return (
    <TooltipProvider>
      <div className="w-full h-full flex items-center justify-center">
        <svg
          viewBox="0 0 600 550"
          className="w-full h-auto max-h-[400px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {Object.entries(STATE_PATHS).map(([stateCode, path]) => {
            const visits = visitsByState[stateCode] || 0;
            const color = calculateStateColor(visits, maxVisits);
            const stateName = BRAZILIAN_STATES[stateCode as keyof typeof BRAZILIAN_STATES];

            return (
              <Tooltip key={stateCode}>
                <TooltipTrigger asChild>
                  <path
                    d={path}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="cursor-pointer transition-all duration-200 hover:opacity-80"
                    onMouseEnter={() => setHoveredState(stateCode)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-semibold">{stateName} ({stateCode})</p>
                    <p className="text-muted-foreground">
                      {visits} {visits === 1 ? 'visita' : 'visitas'}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </svg>
      </div>
    </TooltipProvider>
  );
}

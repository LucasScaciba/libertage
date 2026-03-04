'use client';

import { useEffect, useState } from 'react';
import { StoryAnalytics as StoryAnalyticsType } from '@/types';
import { Eye, Users, TrendingUp } from 'lucide-react';

interface StoryAnalyticsProps {
  storyId: string;
}

export function StoryAnalytics({ storyId }: StoryAnalyticsProps) {
  const [analytics, setAnalytics] = useState<StoryAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [storyId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/stories/${storyId}/analytics`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Carregando analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Total de Visualizações</span>
          </div>
          <p className="text-2xl font-bold">{analytics.view_count}</p>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Visualizadores Únicos</span>
          </div>
          <p className="text-2xl font-bold">{analytics.unique_viewers}</p>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Taxa de Engajamento</span>
          </div>
          <p className="text-2xl font-bold">
            {analytics.view_count > 0
              ? Math.round((analytics.unique_viewers / analytics.view_count) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Views by Day */}
      {analytics.views_by_day.length > 0 && (
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-4">Visualizações por Dia</h3>
          <div className="space-y-2">
            {analytics.views_by_day.map(({ date, count }) => (
              <div key={date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(date).toLocaleDateString('pt-BR')}
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{
                      width: `${(count / Math.max(...analytics.views_by_day.map(v => v.count))) * 100}px`,
                      minWidth: '20px'
                    }}
                  />
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Eye, BarChart3 } from 'lucide-react';
import api from '../services/api';
import type { InstagramMetrics } from '../types/instagram';

interface InstagramMetricsCardProps {
  productId: number;
}

type Period = '7d' | '30d' | '90d';

const periods: Period[] = ['7d', '30d', '90d'];

function formatNumber(n: number): string {
  return n.toLocaleString('es-AR');
}

export const InstagramMetricsCard: React.FC<InstagramMetricsCardProps> = ({ productId }) => {
  const [metrics, setMetrics] = useState<InstagramMetrics | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    if (!productId) {
      setMetrics(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.instagramGetMetrics(productId, period);
      setMetrics(data as InstagramMetrics);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String(
              (err as { response: { data: { message?: string } } }).response?.data?.message ?? '',
            )
          : 'Error al cargar métricas';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [productId, period]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  if (!productId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Seleccioná un producto para ver sus métricas de Instagram
        </CardContent>
      </Card>
    );
  }

  const metricCards = metrics
    ? [
        {
          label: 'Me gusta',
          value: formatNumber(metrics.likeCount),
          icon: Heart,
          color: 'text-red-500',
        },
        {
          label: 'Comentarios',
          value: formatNumber(metrics.commentCount),
          icon: MessageCircle,
          color: 'text-blue-500',
        },
        {
          label: 'Alcance',
          value: formatNumber(metrics.reach),
          icon: Eye,
          color: 'text-green-500',
        },
        {
          label: 'Impresiones',
          value: formatNumber(metrics.impressions),
          icon: BarChart3,
          color: 'text-purple-500',
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-5 pt-5">
        <CardTitle className="text-sm font-medium">Métricas de Instagram</CardTitle>
        <div className="flex gap-1">
          {periods.map((p) => (
            <Button
              key={p}
              type="button"
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Cargando métricas...
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && metrics && (
          <div className="grid grid-cols-2 gap-4">
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="flex flex-col items-center gap-1 rounded-lg bg-muted/30 p-3"
                >
                  <Icon className={`size-5 ${metric.color}`} />
                  <span className="text-lg font-bold">{metric.value}</span>
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InstagramMetricsCard;

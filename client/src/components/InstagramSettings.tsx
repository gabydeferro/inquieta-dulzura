import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';

export const InstagramSettings: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { showNotification } = useNotification();

  const handleRefreshToken = useCallback(async () => {
    setRefreshing(true);
    try {
      await api.instagramRefreshToken();
      showNotification('✅ Token refrescado exitosamente', 'success');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String(
              (err as { response: { data: { message?: string } } }).response?.data?.message ?? '',
            )
          : '';
      showNotification(message || 'Error al refrescar token. Intentalo de nuevo.', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [showNotification]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 px-5 pt-5">
        <div className="flex size-10 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
          <Camera className="size-5 text-pink-500" />
        </div>
        <div>
          <CardTitle className="text-sm font-medium">Configuración de Instagram</CardTitle>
          <p className="text-xs text-muted-foreground">Administrá la conexión con Instagram</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5">
        <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
          <CheckCircle2 className="size-4 text-green-500" />
          <div className="text-sm">
            <span className="font-medium">Estado:</span>{' '}
            <span className="text-muted-foreground">Conectado</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
          <AlertCircle className="size-4 text-amber-500" />
          <div className="text-sm">
            <span className="font-medium">Token:</span>{' '}
            <span className="text-muted-foreground">Vence en 30 días</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleRefreshToken}
          disabled={refreshing}
          className="w-full gap-2"
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refrescando...' : 'Refrescar Token'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default InstagramSettings;

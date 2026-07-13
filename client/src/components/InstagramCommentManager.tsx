import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, EyeOff, Reply } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';
import type { InstagramComment } from '../types/instagram';

interface InstagramCommentManagerProps {
  postId: string;
}

export const InstagramCommentManager: React.FC<InstagramCommentManagerProps> = ({ postId }) => {
  const [comments, setComments] = useState<InstagramComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const { showNotification } = useNotification();

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.instagramGetComments(postId);
      setComments(data as InstagramComment[]);
    } catch {
      showNotification('Error al cargar comentarios', 'error');
    } finally {
      setLoading(false);
    }
  }, [postId, showNotification]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;

    try {
      await api.instagramReplyToComment(commentId, replyText);
      showNotification('✅ Respuesta enviada', 'success');
      setReplyingTo(null);
      setReplyText('');
      void loadComments();
    } catch {
      showNotification('Error al enviar respuesta', 'error');
    }
  };

  const handleHide = async (commentId: string) => {
    try {
      await api.instagramHideComment(commentId);
      showNotification('✅ Comentario ocultado', 'success');
      void loadComments();
    } catch {
      showNotification('Error al ocultar comentario', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MessageCircle className="size-4" />
        Comentarios de Instagram ({comments.length})
      </div>

      {loading && comments.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">Cargando comentarios...</div>
      )}

      {!loading && comments.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">Sin comentarios todavía.</div>
      )}

      {comments.map((comment) => (
        <div key={comment.id} className="rounded-lg border border-border bg-card p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">{comment.username}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.timestamp).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <p className="text-sm text-foreground">{comment.text}</p>

          <div className="mt-2 flex gap-2">
            {replyingTo === comment.id ? (
              <div className="flex w-full gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribí tu respuesta..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyText.trim()}
                >
                  Enviar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  <Reply className="size-3" />
                  Responder
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs text-muted-foreground"
                  onClick={() => handleHide(comment.id)}
                >
                  <EyeOff className="size-3" />
                  Ocultar
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InstagramCommentManager;

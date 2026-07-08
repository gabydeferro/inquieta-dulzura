import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { InstagramCaptionEditor } from './InstagramCaptionEditor';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';

export interface InstagramPublishButtonProps {
  productId: number;
  productName: string;
  productDescription?: string;
  productPrice: number;
  productImageUrl?: string;
}

export const InstagramPublishButton: React.FC<InstagramPublishButtonProps> = ({
  productId,
  productName,
  productDescription,
  productPrice,
  productImageUrl,
}) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const { showNotification } = useNotification();

  const handlePublish = useCallback(
    async (caption: string, image?: File) => {
      setPublishing(true);
      try {
        const imageUrl = productImageUrl || '';
        const { data } = await api.instagramUploadMedia(productId, imageUrl, caption);
        const containerId = (data as { containerId: string }).containerId;

        await api.instagramPublish(productId, containerId, caption);

        showNotification('✅ Publicado en Instagram exitosamente', 'success');
        setEditorOpen(false);

        if (image) {
          // If an image was selected, we'd handle it — for now the API uses the product image URL
        }
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? String((err as { response: { data: { message?: string } } }).response?.data?.message ?? '')
            : '';
        showNotification(
          message || 'Error al publicar en Instagram. Intentalo de nuevo.',
          'error',
        );
      } finally {
        setPublishing(false);
      }
    },
    [productId, productImageUrl, showNotification],
  );

  return (
    <>
      <Button
        type="button"
        onClick={() => setEditorOpen(true)}
        disabled={publishing}
        className="gap-2 bg-pink-500 hover:bg-pink-600"
      >
        {publishing ? 'Publicando...' : 'Publicar en Instagram'}
      </Button>

      <InstagramCaptionEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        productName={productName}
        productDescription={productDescription}
        productPrice={productPrice}
        onPublish={handlePublish}
      />
    </>
  );
};

export default InstagramPublishButton;

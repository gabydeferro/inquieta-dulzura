import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Image } from 'lucide-react';

const MAX_CAPTION_LENGTH = 2200;

export interface InstagramCaptionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productDescription?: string;
  productPrice: number;
  onPublish: (caption: string, image?: File) => void;
}

export const InstagramCaptionEditor: React.FC<InstagramCaptionEditorProps> = ({
  open,
  onOpenChange,
  productName,
  productDescription,
  productPrice,
  onPublish,
}) => {
  const defaultCaption =
    `${productName}\n${productDescription ? productDescription + '\n' : ''}$${Number(productPrice).toFixed(2)}\n\n#InquietaDulzura #Artesanal`;
  const [caption, setCaption] = useState(defaultCaption);
  const [selectedImage, setSelectedImage] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handlePublish = useCallback(() => {
    onPublish(caption, selectedImage);
  }, [caption, selectedImage, onPublish]);

  const charsRemaining = MAX_CAPTION_LENGTH - caption.length;
  const isOverLimit = charsRemaining < 0;

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setCaption(defaultCaption);
        setSelectedImage(undefined);
        setImagePreview(undefined);
      }
      onOpenChange(newOpen);
    },
    [defaultCaption, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-5 text-pink-500" />
            Publicar en Instagram — {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Caption editor */}
          <div className="grid gap-2">
            <Label htmlFor="caption">Pie de foto</Label>
            <div className="relative">
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={6}
                placeholder="Escribí el pie de foto para Instagram..."
                className={`h-32 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 ${
                  isOverLimit ? 'border-destructive' : ''
                }`}
              />
              <div
                className={`absolute bottom-2 right-2 text-xs ${
                  isOverLimit
                    ? 'font-bold text-destructive'
                    : charsRemaining <= 200
                      ? 'text-amber-500'
                      : 'text-muted-foreground'
                }`}
              >
                {caption.length}/{MAX_CAPTION_LENGTH}
              </div>
            </div>
          </div>

          {/* Optional image upload */}
          <div className="grid gap-2">
            <Label htmlFor="image">Foto para Instagram (opcional)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageSelect}
                className="flex-1"
              />
              {imagePreview && (
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="size-full object-cover"
                  />
                </div>
              )}
              {!imagePreview && (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/30">
                  <Image className="size-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos: JPEG, PNG. Si no elegís ninguna, se usará la foto principal del producto.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={isOverLimit}
            className="gap-2 bg-pink-500 hover:bg-pink-600"
          >
            <Camera className="size-4" />
            Publicar en Instagram
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramCaptionEditor;

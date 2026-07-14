import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem } from '../types/Cart';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

interface CartSummaryProps {
  items: CartItem[];
  total: number;
  itemCount: number;
  onUpdateQuantity: (producto_id: number, cantidad: number) => void;
  onRemove: (producto_id: number) => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  total,
  itemCount,
  onUpdateQuantity,
  onRemove,
}) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <ShoppingCart className="mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Carrito vacío</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Carrito</h3>
        <span className="text-xs text-muted-foreground">{itemCount} items</span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="w-24">Cant.</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.tr
                  key={item.producto_id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="border-b last:border-0"
                >
                  <TableCell className="text-sm font-medium">{item.nombre}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        aria-label="Disminuir"
                        onClick={() => onUpdateQuantity(item.producto_id, item.cantidad - 1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.cantidad}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        aria-label="Aumentar"
                        onClick={() => onUpdateQuantity(item.producto_id, item.cantidad + 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">${item.precio.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold">
                    ${(item.precio * item.cantidad).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Eliminar"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onRemove(item.producto_id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
        <span className="text-sm font-bold">Total:</span>
        <span className="text-lg font-bold text-emerald-600">${total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default CartSummary;

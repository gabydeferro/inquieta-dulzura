import React, { useState } from 'react';
import { MetodoPago, METODOS_PAGO } from '../types/Cart';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';

interface PaymentSelectorProps {
  total: number;
  isSubmitting: boolean;
  onConfirm: (metodo: MetodoPago) => void;
}

const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  total,
  isSubmitting,
  onConfirm,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<MetodoPago>('efectivo');

  if (total <= 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Agrega productos al carrito para continuar
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="size-4" />
          Método de Pago
        </h3>
        <span className="text-lg font-bold text-emerald-600">
          ${total.toFixed(2)}
        </span>
      </div>

      <RadioGroup
        value={selectedMethod}
        onValueChange={(value) => setSelectedMethod(value as MetodoPago)}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {METODOS_PAGO.map((method) => (
          <Label
            key={method.value}
            htmlFor={`metodo-${method.value}`}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${
              selectedMethod === method.value
                ? 'border-brand-violet bg-brand-violet/5'
                : 'hover:bg-muted/50'
            }`}
          >
            <RadioGroupItem value={method.value} id={`metodo-${method.value}`} />
            {method.label}
          </Label>
        ))}
      </RadioGroup>

      <Button
        type="button"
        onClick={() => onConfirm(selectedMethod)}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Registrando...' : 'Confirmar Venta'}
      </Button>
    </div>
  );
};

export default PaymentSelector;

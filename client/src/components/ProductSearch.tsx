import React, { useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { Producto } from '../types/Producto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';

interface ProductSearchProps {
  onAddToCart: (product: Producto) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onAddToCart }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.searchProductos(q.trim());
      setResults(response.data);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void doSearch(value);
    }, 300);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar producto..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Buscando...</p>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No se encontraron productos
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{product.nombre}</span>
                <span className="text-xs text-muted-foreground">
                  ${product.precio.toFixed(2)}
                  {product.stock != null && ` — Stock: ${product.stock}`}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddToCart(product)}
              >
                <Plus className="mr-1 size-3.5" />
                Agregar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;

import { Context } from 'grammy';
import { connection } from '../../db';
import { RowDataPacket } from 'mysql2';
import { VentasService } from '../../services/VentasService';
import { CreateVentaDTO, VentaDetalleDTO } from '../../dtos/VentasDTO';

const ventasService = new VentasService();

interface VentaItem {
  producto_id: number;
  cantidad: number;
}

interface ProductoInfo {
  id: number;
  nombre: string;
  precio: number;
}

interface StockInfo {
  producto_id: number;
  cantidad: number;
}

/**
 * Parse a single venta item string "id:cant"
 */
function parseVentaItem(input: string): VentaItem | null {
  const match = input.match(/^(\d+):(\d+)$/);
  if (!match) return null;
  const cantidad = Number(match[2]);
  if (cantidad <= 0) return null;
  return { producto_id: Number(match[1]), cantidad };
}

/**
 * Handler para /venta <id>:<cant> [id:cant...] — crea venta rapida
 */
export async function ventaCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const match = text.match(/^\/venta (.+)$/);

    if (!match) {
      await ctx.reply('❌ Formato: /venta <id>:<cantidad> [id:cantidad...]');
      return;
    }

    const itemsStr = match[1].trim();
    const parts = itemsStr.split(/\s+/);

    // Parse all items
    const items: VentaItem[] = [];
    for (const part of parts) {
      const item = parseVentaItem(part);
      if (!item) {
        await ctx.reply('❌ Formato inválido. Usá: /venta <id>:<cantidad> [id:cantidad...]');
        return;
      }
      items.push(item);
    }

    // Validate each product exists and get prices, while checking stock
    const productosInfo: ProductoInfo[] = [];
    const stockChecks: { producto_id: number; cantidad: number }[] = [];

    for (const item of items) {
      // Check product exists
      const [productos] = await connection.query<RowDataPacket[]>(
        'SELECT id, nombre, precio FROM productos WHERE id = ?',
        [item.producto_id],
      );

      if (productos.length === 0) {
        await ctx.reply(`❌ Producto #${item.producto_id} no encontrado.`);
        return;
      }

      const prod = productos[0] as ProductoInfo;
      productosInfo.push(prod);
      stockChecks.push({ producto_id: item.producto_id, cantidad: item.cantidad });
    }

    // Check stock for each product
    for (const check of stockChecks) {
      const [stockRows] = await connection.query<RowDataPacket[]>(
        'SELECT producto_id, cantidad FROM stock WHERE producto_id = ?',
        [check.producto_id],
      );

      const stockRow = (stockRows as StockInfo[])[0];
      const available = stockRow?.cantidad ?? 0;

      if (available < check.cantidad) {
        await ctx.reply(
          `❌ Stock insuficiente para #${check.producto_id} (disponible: ${available}, solicitado: ${check.cantidad})`,
        );
        return;
      }
    }

    // All validations passed — create venta
    const detalleProductos: VentaDetalleDTO[] = productosInfo.map((prod, i) => ({
      producto_id: prod.id,
      cantidad: items[i].cantidad,
      precio_unitario: prod.precio,
      subtotal: prod.precio * items[i].cantidad,
    }));

    const ventaData: CreateVentaDTO = {
      metodo_pago: 'efectivo',
      productos: detalleProductos,
    };

    const venta = await ventasService.createVenta(ventaData);

    // Update stock for each product
    for (const item of items) {
      await connection.query(
        'UPDATE stock SET cantidad = cantidad - ? WHERE producto_id = ?',
        [item.cantidad, item.producto_id],
      );
    }

    const productosResumen = venta.productos
      .map((p) => `${p.producto_nombre || `#${p.producto_id}`} x${p.cantidad}`)
      .join(', ');

    await ctx.reply(
      `🧾 *Venta #${venta.id} registrada*: $${venta.total}\nProductos: ${productosResumen}`,
      { parse_mode: 'Markdown' },
    );
  } catch (error) {
    console.error('Error en ventaCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

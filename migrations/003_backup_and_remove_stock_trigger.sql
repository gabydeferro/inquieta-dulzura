-- MIGRATION 003: Remove after_venta_detalle_insert trigger
--
-- REASON: Stock decrement moves from DB trigger to service code (VentasService)
-- so we can conditionally skip decrement for MercadoPago payments (deferred until
-- webhook confirms approval).
--
-- ROLLBACK: Re-run the CREATE TRIGGER block below to restore trigger behavior.

-- Backup the trigger DDL (for reference / rollback)
-- TRIGGER after_venta_detalle_insert:
--   AFTER INSERT ON venta_detalle
--   FOR EACH ROW
--   BEGIN
--     UPDATE stock
--     SET cantidad_disponible = cantidad_disponible - NEW.cantidad
--     WHERE producto_id = NEW.producto_id;
--   END

-- Remove the trigger
DROP TRIGGER IF EXISTS after_venta_detalle_insert;

Voy a dividir el trabajo en 3 bloques. Confirmá antes de implementar.

## 1) Buscador real en el header

- Reemplazar el input estático del header por un combobox con búsqueda en vivo.
- Búsqueda en Supabase por `nombre`, `categoria` y `descripcion` con `or(ilike...)` y debounce de 250 ms.
- Dropdown con los primeros 8 resultados (imagen placeholder, nombre, categoría, precio). Click → `/productos/$id`.
- Enter → navega a `/productos?q=...` (página de catálogo, ya soporta `q`).
- En la página `/productos`: el input lateral pasa a búsqueda en vivo (sin necesidad de submit), también buscando por nombre+categoría+descripción.

Cambia `fetchProductos` en `src/lib/products.ts` para que `q` use:
`or(\`nombre.ilike.%${q}%,categoria.ilike.%${q}%,descripcion.ilike.%${q}%\`)`.

## 2) Imágenes WebP en productos

**Migración (no destructiva):**
```sql
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_webp text;
```
(Si ya existiera otra columna de imagen la usamos como fallback; hoy no hay ninguna, por eso agrego también `image_url`.)

**Storage:** crear bucket público `product-images` con políticas: lectura pública, escritura solo para admins (`has_role(auth.uid(),'admin')`).

**Componente `<ProductImage>`** reutilizable con `<picture>`:
- `<source type="image/webp" srcset={image_webp}>` si existe
- `<img src={image_url ?? placeholder} loading="lazy" decoding="async" sizes=...>`
- Fallback al ícono `Package` actual si no hay nada.

Lo aplico en: `ProductCard`, página `productos/$id`, sliders del home, panel admin.

**Admin productos:**
- En el modal de edición agregar uploader que acepta `.webp`, `.jpg`, `.png`.
- Si suben no-webp → se sube tal cual a `image_url`. Si suben `.webp` → a `image_webp`. (No hago conversión server-side: el runtime Worker no soporta `sharp`. La conversión queda a cargo del usuario o de un paso futuro.)
- Validación: máx 2 MB, tipos permitidos.

## 3) Filtros avanzados en `/productos`

Sin tocar el schema. Agrego en `validateSearch`: `cat`, `grupo`, `min`, `max`, `sort` (`relevance|price-asc|price-desc|name-asc`), `q`, `page`.

- Sidebar: categorías (ya existe), marca = `grupo` (lista derivada de DB), slider/inputs de precio min-max, select de orden.
- `fetchProductos` recibe `min`, `max`, `sort` y aplica `.gte('precio',min).lte('precio',max)` y `.order(...)`.
- Combinación libre, actualización al cambiar (URL = estado).
- Estado vacío con botón "Limpiar filtros" (ya existe parcialmente, lo amplío).
- Performance: paginación server-side ya está; agrego índice:
```sql
CREATE INDEX IF NOT EXISTS productos_precio_idx ON public.productos (precio);
CREATE INDEX IF NOT EXISTS productos_grupo_idx  ON public.productos (grupo);
```

## Orden de ejecución

1. Migración SQL (columnas + índices) y bucket de storage.
2. `<ProductImage>` + actualizar cards/detalle/sliders.
3. Buscador del header + búsqueda extendida en `fetchProductos`.
4. Filtros avanzados en catálogo.
5. Uploader en admin.

¿Avanzo con todo en este orden, o querés que arranque solo por una parte (ej. 1 primero)?
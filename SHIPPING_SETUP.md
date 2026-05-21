# Configuración del Calculador de Envío - Correo Argentino

## Instalación

El calculador de envío ya está integrado en tu aplicación. Estos archivos fueron creados:

- `src/lib/shipping.functions.ts` - Funciones server para calcular envíos con Correo Argentino
- `src/components/ShippingCalculator.tsx` - Componente React para mostrar opciones de envío
- `src/routes/checkout.tsx` - Actualizado para incluir el calculador

## Variables de Entorno

Para conectar con la API real de Correo Argentino, agrega las siguientes variables a tu archivo `.env.local`:

```env
CORREO_ARGENTINO_USERNAME=tu_usuario
CORREO_ARGENTINO_PASSWORD=tu_contrasena
CORREO_ARGENTINO_API_KEY=tu_api_key_opcional
```

### Cómo obtener las credenciales:

1. Accede a https://www.correoargentino.com.ar/
2. Regístrate como usuario comercial
3. Accede a tu panel de control
4. Busca la sección "Herramientas" o "Integraciones"
5. Solicita acceso a la API de cotización
6. Copia tu usuario, contraseña y API key

## API de Correo Argentino

La implementación utiliza el endpoint:
- **URL**: `https://api.correoargentino.com.ar/cv/v1.0/cotizador`
- **Método**: POST
- **Documentación**: https://www.correoargentino.com.ar/negocios

### Servicios disponibles que calcula:

- **Carta Simple**: Documentos sin registro
- **Carta Documento**: Documentos con comprobante
- **Encomienda OCA**: Paquetes estándar
- **Encomienda Express**: Paquetes prioritarios

## Uso del Componente

El calculador se utiliza en el checkout automáticamente:

```tsx
<ShippingCalculator
  codigoPostal="1636"  // Código postal del destinatario
  peso={2}             // Peso en kg
  largo={30}           // Largo en cm (opcional)
  ancho={20}           // Ancho en cm (opcional)
  alto={15}            // Alto en cm (opcional)
  onShippingSelect={(option) => console.log(option)}  // Callback cuando selecciona envío
  selectedShipping="estandar"  // Envío preseleccionado
/>
```

## Estructura de respuesta

Cada opción de envío retorna:

```typescript
{
  servicio: "Estándar",                    // Nombre del servicio
  descripcion: "Envío estándar (5-7 días)",
  dias_habiles: 6,                        // Días de entrega
  precio: 500,                            // Precio en ARS
  codigo_servicio: "estandar"            // Identificador único
}
```

## Precios por defecto (cuando API no está disponible)

Si la API de Correo Argentino no está configurada o no responde, se muestran precios por defecto:

- **Estándar**: $500 + $50 por kg
- **Rápido**: $750 + $75 por kg  
- **Express**: $1250 + $125 por kg

## Estructura de datos guardada en órdenes

Cuando se crea una orden, los datos de envío se guardan como:

```typescript
{
  servicio: "Estándar",
  descripcion: "Envío estándar (5-7 días hábiles)",
  costo: 500,
  dias_habiles: 6,
  codigo_servicio: "estandar"
}
```

## Próximas mejoras sugeridas

1. **Cálculo automático de peso**: Agregar peso a cada producto en la base de datos
2. **Validación de código postal**: Verificar que el código postal sea válido antes de calcular
3. **Seguimiento**: Integrar sistema de seguimiento con número de tracking
4. **Múltiples transportistas**: Agregar opciones de DHL, FedEx, OCA
5. **Pickup points**: Permitir retiro en sucursales en lugar de envío a domicilio

## Solución de problemas

### "No hay opciones de envío disponibles"
- Verifica que el código postal sea válido
- Comprueba que las credenciales de Correo Argentino sean correctas
- Revisa los logs del servidor para más detalles

### "Error al calcular envío"
- Asegúrate de tener internet en el servidor
- Verifica que la API de Correo Argentino esté disponible
- Comprueba que no haya cambios en su documentación

### El precio no coincide con Correo Argentino
- La API puede requerir actualización de documentación
- Los precios pueden cambiar según volumen de envíos
- Contacta con Correo Argentino para verificar tarifas

## Debugging

Habilita logs más detallados en `src/lib/shipping.functions.ts`:

```typescript
console.log("Payload:", payload);
console.log("Response:", data);
```

## Support

Para más información sobre la API de Correo Argentino:
- Web: https://www.correoargentino.com.ar/
- Email: integraciones@correoargentino.com.ar
- Teléfono: 0810-555-2674

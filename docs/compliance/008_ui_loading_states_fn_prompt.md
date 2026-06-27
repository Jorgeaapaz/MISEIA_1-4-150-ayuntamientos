@~/.claude/prompts/new_functionality_prompt_spec.md

# Implementar Estados de Carga, Error y Vacío en UI

## Role
Act as a Frontend Developer expert in React 19, Next.js 16 App Router, and Tailwind CSS UI patterns.

## Context
Proyecto: Sede Electrónica — Next.js 16 / React 19 / TypeScript / Tailwind CSS v4  
Ruta: `D:\Master-IA-Dev\04-Bloque4\1-4-150-ayuntamientos\ayuntamientos`  
Tema: oscuro, color de acento `#3B82F6` (azul), sin imágenes, iconos SVG inline  

Páginas que requieren estados de carga/error/vacío:
- `/mis-registros` — lista de registros del administrado (estado loading mientras fetch, empty state si 0 registros, error si falla la API)
- `/funcionario/registros` — tabla de todos los registros (mismo patrón)
- `/funcionario/expedientes` — lista de expedientes
- `/mis-registros/[id]` — detalle de registro (loading skeleton, not found)
- `/funcionario/expedientes/[id]` — detalle de expediente
- Formularios — estado de envío (loading button, success/error feedback)

## Task
Añadir estados de carga (skeletons/spinners), estados de error (mensaje + retry), y estados vacíos (empty state) de forma consistente en todas las páginas que hacen fetch de datos.

### UI States Guidelines

**Componentes a crear en `components/ui/`:**

1. `Skeleton.tsx` — componente de skeleton animado:
```tsx
// Skeleton de una línea, parametrizable en ancho/alto
export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-700 rounded ${className}`} />
}
```

2. `EmptyState.tsx` — estado vacío con icono y mensaje:
```tsx
interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
}
```

3. `ErrorState.tsx` — estado de error con botón de retry:
```tsx
interface ErrorStateProps {
  message: string
  onRetry?: () => void
}
```

**Patrón de implementación en páginas con fetch:**
```tsx
// Estado: loading | error | empty | data
const [state, setState] = useState<'loading' | 'error' | 'empty' | 'data'>('loading')

if (state === 'loading') return <SkeletonList />
if (state === 'error') return <ErrorState message="Error al cargar los registros" onRetry={fetchData} />
if (state === 'empty') return <EmptyState title="Sin registros" description="No has presentado ninguna instancia aún." />
// render data
```

**Formularios:**
- Botón de submit debe cambiar a estado loading mientras se procesa: `disabled` + spinner SVG inline
- Mostrar mensaje de éxito (verde) o error (rojo) tras el submit
- No navegar hasta confirmar el éxito del submit

### Páginas a actualizar:
1. `app/mis-registros/page.tsx` — skeleton list + empty state + error
2. `app/mis-registros/[id]/page.tsx` — skeleton detail + not found (404)
3. `app/funcionario/registros/page.tsx` — skeleton table + empty + error
4. `app/funcionario/expedientes/page.tsx` — skeleton list + empty + error
5. `app/funcionario/expedientes/[id]/page.tsx` — skeleton detail + not found
6. `app/instancia/nueva/page.tsx` — loading button en submit + success/error feedback

### Design Guidelines (tema oscuro)
- Skeleton: `bg-gray-700` con `animate-pulse`
- Empty state: icono SVG inline (bandeja vacía o documento), texto `text-gray-400`
- Error state: icono SVG de advertencia, texto `text-red-400`, botón retry `text-blue-400`
- Loading button: spinner SVG `animate-spin` + texto "Enviando..."

## Output format
- `components/ui/Skeleton.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/ErrorState.tsx`
- Todas las páginas listadas actualizadas con los tres estados

## Examples and Steps to Follow
1. Crear rama `feat/ui-loading-states`
2. Crear los 3 componentes UI
3. Actualizar cada página aplicando el patrón de estados
4. Verificar visualmente en `npm run dev` con datos reales y con red lenta (DevTools throttling)
5. `npm run lint` y `npm run build` deben pasar
6. Commit y PR

## Output Checklist and Guardrails
- [ ] Todas las páginas con fetch muestran spinner/skeleton durante la carga
- [ ] Empty state visible cuando no hay datos (verificar con BD vacía)
- [ ] Error state visible cuando la API falla (verificar con MongoDB parado)
- [ ] Botón de submit en formularios muestra loading durante el envío
- [ ] Consistencia visual: mismos colores y estilos en todos los estados
- [ ] `npm run build` pasa sin errores TypeScript
- [ ] Sin regresiones en el flujo principal (verificar con Playwright si los tests existen)

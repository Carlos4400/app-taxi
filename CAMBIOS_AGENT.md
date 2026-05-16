# Cambios del Agente

Este archivo registra cambios de código hechos por agentes/modelos en este proyecto.

Cada entrada debe indicar archivos modificados, código anterior, código nuevo y por qué se cambió.

## 2026-05-17 - Regla para código nuevo añadido

### Fecha
2026-05-17

### Archivos modificados
- `AGENTS.md`

### Cambio 1 - Añadir regla de código nuevo añadido

#### Código anterior
```md
`Por qué se cambió` debe explicar el motivo concreto de sustituir ese código por el nuevo.

Si no puedes verificar el código anterior literal, dilo explícitamente en la entrada.
```

#### Código nuevo
```md
`Por qué se cambió` debe explicar el motivo concreto de sustituir ese código por el nuevo.

Si añades código nuevo que antes no existía, regístralo como cambio independiente. Esto incluye componentes, funciones, constantes, tipos, helpers, estilos, bloques JSX y assets.

No documentes solo dónde se usa el código nuevo. Documenta también la creación del bloque nuevo.

Para código nuevo, usa como código anterior: `No existía [nombre del bloque] en [archivo].`

Si no puedes verificar el código anterior literal, dilo explícitamente en la entrada.
```

#### Por qué se cambió
Se añadió esta regla para que el proyecto documente como cambio independiente cualquier bloque nuevo creado, no solo el lugar donde se usa.

## 2026-05-17 - Ajustes visuales en main.tsx

### Fecha
2026-05-17

### Archivos modificados
- `src/main.tsx`

### Cambio 1 - Añadir componente IconNoteAdd

#### Código anterior
```txt
No existía el componente `IconNoteAdd` en `src/main.tsx`.
```

#### Código nuevo
```tsx
const IconNoteAdd = ({ s = 20, c = C }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
    <path
      stroke={c}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 17.25c0 1.5913 0.6321 3.1174 1.7574 4.2426 1.1252 1.1253 2.6513 1.7574 4.2426 1.7574 1.5913 0 3.1174 -0.6321 4.2426 -1.7574 1.1253 -1.1252 1.7574 -2.6513 1.7574 -4.2426 0 -1.5913 -0.6321 -3.1174 -1.7574 -4.2426 -1.1252 -1.1253 -2.6513 -1.7574 -4.2426 -1.7574 -1.5913 0 -3.1174 0.6321 -4.2426 1.7574 -1.1253 1.1252 -1.7574 2.6513 -1.7574 4.2426Z"
      strokeWidth="1.5"
      style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c})` }}
    />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M17.25 14.25v6" strokeWidth="1.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M14.25 17.25h6" strokeWidth="1.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h10.5" strokeWidth="1.5" opacity="0.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 11.25h6" strokeWidth="1.5" opacity="0.6" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75H7.5" strokeWidth="1.5" opacity="0.4" />
    <path
      stroke={c}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5"
      strokeWidth="1.7"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
  </svg>
);
```

#### Por qué se cambió
Se añadió `IconNoteAdd` para disponer de un icono SVG propio de nota con símbolo de añadir y efecto de brillo, reutilizable en el botón `Añadir Nota al Turno`.

### Cambio 2 - Botón Añadir Nota al Turno

#### Código anterior
```tsx
style={{
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.6)",
  fontSize: 14,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  transition: "all 0.2s"
}}
>
  <span style={{ fontSize: 18 }}>📝</span> Añadir Nota al Turno
</button>
```

#### Código nuevo
```tsx
style={{
  width: "100%",
  height: 48,
  padding: "0 16px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.6)",
  fontSize: 14,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  cursor: "pointer",
  transition: "all 0.2s"
}}
>
  <IconNoteAdd s={26} /> Añadir Nota al Turno
</button>
```

#### Por qué se cambió
Se cambió el emoji `📝` por `IconNoteAdd` para usar un icono SVG propio con estilo neón. También se cambió el padding por `height: 48` y `padding: "0 16px"` para que el botón tenga una altura fija y más estable.

### Cambio 3 - Filtros de brillo en IconNoteAdd

#### Código anterior
```tsx
style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c}66)` }}
```

```tsx
style={{ filter: `drop-shadow(0 0 1px ${c}88)` }}
```

#### Código nuevo
```tsx
style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c})` }}
```

```tsx
style={{ filter: `drop-shadow(0 0 1px ${c})` }}
```

#### Por qué se cambió
Se eliminaron los sufijos `${c}66` y `${c}88` porque `c` puede ser un color `oklch(...)`, y concatenar esos sufijos genera un valor CSS inválido.

### Cambio 4 - Tamaño responsive del título de resumen de turno

#### Código anterior
```tsx
fontSize: "clamp(10px, 3.4cqw, 17px)",
```

#### Código nuevo
```tsx
fontSize: "clamp(15px, 4.2vw, 20px)",
```

#### Por qué se cambió
Se cambió el tamaño anterior por `clamp(15px, 4.2vw, 20px)` para que el título de fecha del resumen mantenga legibilidad y se adapte mejor al ancho del móvil.

### Cambio 5 - Tamaño responsive del título de detalle de semana

#### Código anterior
```tsx
fontSize: 20,
```

#### Código nuevo
```tsx
fontSize: "clamp(15px, 4.2vw, 20px)",
```

#### Por qué se cambió
Se cambió el tamaño fijo `20` por `clamp(15px, 4.2vw, 20px)` para que el rango de fechas de la semana use el mismo comportamiento responsive que el título del resumen de turno.

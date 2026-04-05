# 💵 Cash Flows System - Setup Guide

## ✅ Sistema Implementado

Este sistema permite rastrear **ingresos** (deposits) y **retiros** (withdrawals) para calcular el rendimiento real de tu portafolio.

### Funcionalidades:
- ✅ Registro de depósitos al portafolio
- ✅ Registro de retiros del portafolio
- ✅ Conversión automática USD ↔ COP
- ✅ Métricas de rendimiento real (excluyendo cash flows)
- ✅ Historial de movimientos
- ✅ Multi-moneda (USD, COP, EUR)

---

## 🚀 Paso 1: Ejecutar Migración SQL

**IMPORTANTE:** Debes ejecutar la migración SQL en Supabase para crear la tabla `cash_flows`.

### Opción A: Desde Supabase Dashboard (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/suhcjawnmpomezfbsklj/editor
2. Copia el contenido de `app/supabase/migrations/007_cash_flows.sql`
3. Pega en el editor SQL
4. Click en **"Run"**

### Opción B: Código SQL Directo

```sql
-- Cash flows table
CREATE TABLE cash_flows (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date            DATE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'COP', 'EUR')),
  account         TEXT,
  from_account    TEXT,
  to_account      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_accounts CHECK (
    (type IN ('deposit', 'withdrawal') AND account IS NOT NULL AND from_account IS NULL AND to_account IS NULL)
    OR
    (type = 'transfer' AND account IS NULL AND from_account IS NOT NULL AND to_account IS NOT NULL)
  )
);

CREATE INDEX idx_cash_flows_date ON cash_flows(date DESC);
CREATE INDEX idx_cash_flows_type ON cash_flows(type);
CREATE INDEX idx_cash_flows_account ON cash_flows(account);

ALTER TABLE cash_flows DISABLE ROW LEVEL SECURITY;

ALTER TABLE portfolio_config ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'COP';
UPDATE portfolio_config SET currency = 'COP' WHERE category = 'savings';
```

---

## 📱 Paso 2: Usar el Sistema

### Crear un Nuevo Registro

1. Ve al dashboard: http://localhost:3000
2. Click en el botón **"NUEVO REGISTRO"**
3. Selecciona el tipo:
   - 📊 **Registro Diario** → Snapshot completo del portafolio
   - 💵 **Ingreso de Dinero** → Depósito al portafolio
   - 💸 **Retiro de Dinero** → Retiro del portafolio

### Registrar un Depósito

1. Selecciona **"Ingreso de Dinero"**
2. Completa el formulario:
   - Fecha
   - Monto y moneda (USD, COP, EUR)
   - Cuenta destino (XTB Cash, Trii Cash, etc.)
   - Notas (opcional)
3. Click en **"Guardar Ingreso"**

### Registrar un Retiro

1. Selecciona **"Retiro de Dinero"**
2. Completa el formulario:
   - Fecha
   - Monto y moneda
   - Cuenta origen
   - Notas (opcional)
3. Click en **"Guardar Retiro"**

---

## 📊 Cómo Afecta las Métricas

### Sin Cash Flows (Antes)
```
Día 1: $3,000
Día 2: $3,500 → +$500 (+16.7%) ❌ INCORRECTO
       (incluye depósito de $500)
```

### Con Cash Flows (Ahora)
```
Día 1: $3,000
Día 2: $3,500
       Menos depósito: -$500
       ─────────────────────
       Real: $3,000 → +$0 (0%) ✅ CORRECTO
```

---

## 🎯 Próximas Mejoras

Las siguientes funcionalidades están pendientes de implementación:

1. **Analytics Dashboard**
   - Gráficas de evolución con/sin cash flows
   - Métricas TWR (Time-Weighted Return)
   - Historial completo de movimientos

2. **Cálculos Automáticos**
   - P&L real excluyendo depósitos/retiros
   - Return % calculado correctamente
   - Comparación periodo a periodo

3. **Transferencias Internas**
   - Mover dinero entre XTB ↔ Trii
   - Mover dinero entre cuentas de ahorro

---

## 🐛 Troubleshooting

### Error: "table 'cash_flows' does not exist"
- **Solución:** Ejecuta la migración SQL (Paso 1)

### Error: "column 'currency' does not exist in portfolio_config"
- **Solución:** Ejecuta la parte de ALTER TABLE de la migración

### No veo los cash flows en el dashboard
- **Solución:** Recarga la página con Cmd+R

---

## 📂 Archivos Creados

```
app/
├── supabase/migrations/
│   └── 007_cash_flows.sql          ← Migración SQL
├── src/
│   ├── app/
│   │   ├── new/
│   │   │   └── page.tsx            ← Selector de tipo
│   │   └── cashflow/
│   │       ├── deposit/
│   │       │   └── page.tsx        ← Formulario depósito
│   │       └── withdrawal/
│   │           └── page.tsx        ← Formulario retiro
│   ├── components/ui/
│   │   └── textarea.tsx            ← Componente Textarea
│   └── lib/
│       ├── supabase/
│       │   └── cash-flows.ts       ← Queries cash flows
│       ├── types.ts                ← Tipos TypeScript
│       └── i18n/
│           └── translations.ts     ← Traducciones ES/EN
```

---

¿Necesitas ayuda? Revisa el código o pregúntame! 🚀

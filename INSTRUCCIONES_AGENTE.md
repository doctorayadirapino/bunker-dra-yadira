# ONBOARDING DEL PROYECTO (NOTAS PARA AGENTES)

Este archivo resume como trabajar en el proyecto sin poner en riesgo credenciales ni datos sensibles.

## Seguridad (Regla Cero)
- Nunca pegues tokens, contrasenas, llaves privadas o URLs con credenciales en el repo (tampoco en archivos `.md`).
- En Vite, SOLO se exponen al frontend variables con prefijo `VITE_`.
- Tokens de Supabase management/service role, Vercel y GitHub: solo en gestor de secretos o variables del entorno de despliegue.

## Arranque Local
1. `npm install`
2. `npm run dev`

## Modulos del Sistema
- Laboral: vigilancia epidemiologica + BI/Analytics.
- Fisiatria: flujo optimizado para rehabilitacion.

Antes de cambios grandes en UI o datos, confirmar con el usuario cual modulo se esta tocando para no romper el otro.

## Supabase
- Cliente en `src/lib/supabase.ts` (usa `sessionStorage`).
- Recomendacion: validar RLS estricta en tablas `pacientes`, `consultas`, `empresas`, `antecedentes_laborales` y cualquier vista usada por BI o Realtime.


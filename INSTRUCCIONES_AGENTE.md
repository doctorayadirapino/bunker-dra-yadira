# 🤖 PROTOCOLO DE DESPERTAR PARA NUEVAS INSTANCIAS DE IA (ANTIGRAVITY)
*Documento Autorizado por: Carlos Fuentes (Arquitecto)*

Si estás leyendo esto, eres una nueva instancia de IA o Agente de Desarrollo que acaba de recibir la carpeta del proyecto **"Búnker Dra. Yadira Pino"**. No empieces desde cero ni le pidas al usuario que inicie sesión en los servicios. Tu contexto, base de datos y despliegues ya están configurados. Sigue estas reglas de inicialización:

## 1. 🚨 REGLAS INNEGOCIABLES DE CARLOS FUENTES (PRIORIDAD CERO)
1. **USO OBLIGATORIO DE TOKENS:** *Bajo ninguna circunstancia* pedirás a Carlos Fuentes que inicie sesión manualmente. Tienes la obligación matemática de usar los tokens de acceso guardados para GitHub, Vercel y Supabase. Esta regla es innegociable.
2. **SELECCIÓN DE MÓDULO:** Antes de escribir una sola línea de lógica o modificar componentes, *tienes la obligación de preguntarle a Carlos Fuentes* en qué módulo se va a trabajar ("Laboral" o "Fisiatría"). La decisión que él tome dicta la línea de trabajo, y no puedes salirte jamás de esa decisión. 

## 2. ⚙️ INSTALACIÓN TÉCNICA RE-DESPLIEGUE (No pidas permisos ni logins)
El proyecto es una aplicación purificada basada en **React + Vite** con TypeScript. Para arrancar o editar en esta nueva máquina, solo necesitas:
1.  **Ejecutar:** `npm install` (Para bajar los paquetes locales si no están).
2.  **Ejecutar:** `npm run dev` (Para levantar el servidor local).

## 3. 🗄️ CONEXIÓN DE BASE DE DATOS Y DOMINIOS
1.  **NO ABRAS NINGÚN LOGIN MANUAL DE SUPABASE.** Usa tu MCP o credenciales guardadas. El proyecto funciona con la Base de Datos *Supabase Cloud* oficial y ya cuenta con el archivo `.env.local` y `.env`.
2.  La seguridad Front-End (Autenticación) de la doctora es **Zero Trust**. Modificamos el cliente de Supabase para que use `sessionStorage`. El login morirá cada vez que se cierre la pestaña.

## 4. 🚀 DESPLIEGUE A PRODUCCIÓN AUTOMÁTICO (Vercel Ligado)
1.  **NO PIDAS VINCULAR O HACER LOGIN EN VERCEL CLOUD.** El entorno ya fue vinculado.

## 5. 🧠 CONTEXTUALIZACIÓN MÉDICA Y ARQUITECTURA
Revisa el documento maestro guardado como `MEMORIA_PROYECTO.md` en este mismo directorio. Allí el usuario tiene detalladas:
*   Las optimizaciones gráficas y eliminaciones de código espagueti.
*   Cómo funciona el borrado en cascada (Si borran un paciente, se borran sus tareas).
*   La asignación de credenciales reales (La Dra entra con un solo correo aprobado).
*   La generación de certificados en PDF.

No destruyas la arquitectura base ni alteres los protocolos corporativos (Colores Azul/Rosa, Modo Oscuro Shadcn). 

**EJECUTA LAS ÓRDENES SIN DUDAR, YA ESTÁS DENTRO DEL BÚNKER. BIENVENIDO.**

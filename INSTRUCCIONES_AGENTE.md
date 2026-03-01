# 🤖 PROTOCOLO DE DESPERTAR PARA NUEVAS INSTANCIAS DE IA (ANTIGRAVITY)
*Documento Autorizado por: Carlos Fuentes (Arquitecto)*

Si estás leyendo esto, eres una nueva instancia de IA o Agente de Desarrollo que acaba de recibir la carpeta del proyecto **"Búnker Dra. Yadira Pino"**. No empieces desde cero ni le pidas al usuario que inicie sesión en los servicios. Tu contexto, base de datos y despliegues ya están configurados. Sigue estas reglas de inicialización:

## 1. ⚙️ INSTALACIÓN TÉCNICA RE-DESPLIEGUE (No pidas permisos ni logins)
El proyecto es una aplicación purificada basada en **React + Vite** con TypeScript. Para arrancar o editar en esta nueva máquina, solo necesitas:
1.  **Ejecutar:** `npm install` (Para bajar los paquetes locales si no están).
2.  **Ejecutar:** `npm run dev` (Para levantar el servidor local).

## 2. 🗄️ CONEXIÓN DE BASE DE DATOS (Supabase Totalmente Configurado)
1.  **NO ABRAS NINGÚN LOGIN MANUAL DE SUPABASE.** El proyecto funciona con la Base de Datos *Supabase Cloud* oficial y ya cuenta con el archivo `.env.local` y `.env` con las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` reales. 
2.  La seguridad Front-End (Autenticación) de la doctora es **Zero Trust**. Modificamos el cliente de Supabase para que use `sessionStorage`. El login morirá cada vez que se cierre la pestaña.

## 3. 🚀 DESPLIEGUE A PRODUCCIÓN AUTOMÁTICO (Vercel Ligado)
1.  **NO PIDAS VINCULAR O HACER LOGIN EN VERCEL CLOUD.** El entorno ya fue vinculado.
2.  Este proyecto viaja con la carpeta oculta `.vercel` y un archivo `project.json` inyectado con el `projectId`, `orgId` y los tokens correctos.
3.  Si Carlos Fuentes pide una actualización de versión o un cambio visible, una vez hecho, solo debes soltar el comando `npx vercel --prod --yes` o correr los scripts del `package.json`. *El Despliegue Oficial en vivo funcionará mágicamente hacia el dominio `doctora-yadira-pino.vercel.app`.*

## 4. 🧠 CONTEXTUALIZACIÓN MÉDICA Y ARQUITECTURA
Revisa el documento maestro guardado como `MEMORIA_PROYECTO.md` en este mismo directorio. Allí el usuario tiene detalladas:
*   Las optimizaciones gráficas y eliminaciones de código espagueti.
*   Cómo funciona el borrado en cascada (Si borran un paciente, se borran sus tareas).
*   La asignación de credenciales reales (La Dra entra con un solo correo aprobado).
*   La generación de certificados en PDF.

No destruyas la arquitectura base ni alteres los protocolos corporativos (Colores Azul/Rosa, Modo Oscuro Shadcn). 

**EJECUTA LAS ÓRDENES SIN DUDAR, YA ESTÁS DENTRO DEL BÚNKER. BIENVENIDO.**

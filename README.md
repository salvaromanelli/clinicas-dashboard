# Dashboard de Administración de Clínicas

Dashboard de administración para la gestión de usuarios y clínicas desarrollado con React y Supabase.

## Características

- Gestión de usuarios (administradores, médicos, desarrolladores)
- Asignación de usuarios a clínicas
- Interfaz adaptativa
- Autenticación segura
- Separación de usuarios de dashboard y app móvil

## Tecnologías utilizadas

- React
- Vite
- Supabase (Backend as a Service)
- TailwindCSS

## Capturas de pantalla

A continuación se muestran algunas capturas de pantalla del dashboard:

![Vista principal](https://github.com/salvaromanelli/clinicas-dashboard/blob/main/main.png)
![Screenshot 2](https://github.com/salvaromanelli/clinicas-dashboard/blob/main/metrics.png)
![Screenshot 3](https://github.com/salvaromanelli/clinicas-dashboard/blob/main/metrics2.png)
![Screenshot 4](https://github.com/salvaromanelli/clinicas-dashboard/blob/main/chatbot.png)

## Configuración del proyecto

1. Clona este repositorio
2. Instala las dependencias con `npm install`
3. Crea un archivo `.env` basado en `.env.example`
4. Ejecuta el proyecto con `npm run dev`

## Estructura de la base de datos

- `auth.users`: Usuarios de autenticación
- `dashboard_users`: Usuarios del panel de administración
- `clinics`: Información de las clínicas

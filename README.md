# FixtureMundial 🏆🌍

![FixtureMundial Banner](https://via.placeholder.com/1200x300.png?text=Fixture+Mundial+-+Pron%C3%B3sticos+y+Simulaci%C3%B3n)

Bienvenido a **FixtureMundial**, una aplicación web Full-Stack diseñada para gestionar, predecir y simular el desarrollo completo de un torneo de selecciones de 32 equipos. Invita a tus amigos, realiza pronósticos, suma puntos acertando resultados y viví la experiencia del torneo al máximo gracias a nuestro simulador interactivo.

---

## ✨ Características Principales

*   **Pronósticos Interactivos:** Interfaz intuitiva para predecir los resultados de todos los partidos de la Fase de Grupos.
*   **Tablas de Posiciones Automáticas:** El sistema calcula matemáticamente los puntos (Pts), Diferencia de Goles (DG) y Goles a Favor (GF) en tiempo real, adaptándose a cada regla estándar de la FIFA.
*   **Desempates Manuales Inteligentes:** Cuando dos equipos terminan estadísticamente idénticos, la aplicación detecta el empate y te exige arrastrar y soltar (Drag & Drop) para elegir manualmente quién clasifica primero. Resuelve tanto empates dentro de un mismo grupo como el desempate por los *Mejores Terceros*.
*   **Bracket de Eliminatorias Dinámico:** Visualizador de llaves de "Knockout" (Dieciseisavos a Final) construido con geometría matemática absoluta para evitar solapamientos y lograr el diseño simétrico más limpio y profesional posible. ¡Acompaña la trayectoria de los países sólo con sus banderas!
*   **Panel de Administración Seguro:** Panel exclusivo protegido por **JWT** y control de roles que permite al Administrador ingresar los resultados reales de los partidos de la vida real.
*   **Sistema de Puntuación (Leaderboard):** Al cargar los resultados reales, el Backend compara automáticamente todas las predicciones de la base de datos de los usuarios, otorgando puntajes por victorias exactas, empates, y resultados parciales.
*   **Interfaz de UI Premium:** Diseñada con CSS vainilla aplicando los últimos estándares del diseño moderno: animaciones suaves (*Framer Motion*), efecto *Glassmorphism*, paletas contrastantes, un modo nocturno base precioso y conectores geométricos perfectos en el bracket.

---

## Tecnologías Utilizadas

Este proyecto sigue una arquitectura **Cliente-Servidor (Frontend-Backend)** con un enfoque moderno:

### Frontend
*   **React 18** (Librería principal)
*   **Vite** (Empaquetador y entorno de desarrollo ultra rápido)
*   **React Router DOM** (Navegación SPA)
*   **Framer Motion** (Animaciones fluidas y Drag & Drop)
*   **Lucide React** (Iconografía)
*   **CSS Vainilla** (Arquitectura pura sin frameworks pesados, con geometría 100% responsiva)

### Backend
*   **Node.js & Express.js** (Servidor HTTP RESTful)
*   **SQLite3** (Base de datos relacional ultraligera en tiempo real)
*   **JWT (JSON Web Tokens)** (Autenticación y seguridad de sesiones)
*   **Bcrypt** (Encriptamiento seguro de contraseñas de usuarios)
*   **CORS & Dotenv** (Seguridad y configuración de entorno)

---

## Instalación y Despliegue Local

Sigue estos pasos para correr la aplicación localmente en tu máquina.

### 1. Requisitos Previos
*   Instalar **[Node.js](https://nodejs.org/)** (v18 o superior).
*   Instalar **Git**.

### 2. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/FixtureMundial.git
cd FixtureMundial
```

### 3. Configurar el Backend (Servidor)
```bash
cd backend
npm install
```
Renombra el archivo `.env.example` a `.env` (si existe, o créalo) y define los secretos:
```env
PORT=3000
JWT_SECRET=escribe_aqui_una_contraseña_secreta_muy_larga
```
Inicia el servidor backend:
```bash
npm run dev
```

### 4. Configurar el Frontend (Cliente)
Abre otra terminal en la raíz del proyecto:
```bash
cd frontend
npm install
```
Asegúrate de que la URL de la API apunte al backend en un archivo `.env` o en la configuración:
```env
VITE_API_URL=http://localhost:3000/api
```
Inicia la vista de React:
```bash
npm run dev
```
Haz clic en el enlace `http://localhost:5173` para visitar tu plataforma.

---

## Estructura y Estándares de Seguridad

Este repositorio ha sido configurado para seguir buenas prácticas de seguridad y código abierto:
*   Las bases de datos `.db` o los estados temporales compilados (`-shm`, `-wal`) nunca se suben al código fuente para proteger las credenciales reales de los usuarios y mantener el código liviano.
*   Archivos de entorno `.env` están rigurosamente excluidos a través de `.gitignore`.
*   Control de rutas Front y Back. Si intentas forzar URLs de `/admin` en el explorador, la aplicación detectará instantáneamente el falso nivel de privilegios y te prohibirá la vista sin una firma del servidor Backend.

---

## Capturas de Pantalla

*(Puedes tomar fotos de tu app y arrastrarlas aquí de GitHub para reemplazarlas!)*

| Fase de Grupos | Bracket End-To-End |
| :---: | :---: |
| ![Placeholder Groups](https://via.placeholder.com/400x250.png?text=Grupos+UI) | ![Placeholder Bracket](https://via.placeholder.com/400x250.png?text=Bracket+Visualizer) |



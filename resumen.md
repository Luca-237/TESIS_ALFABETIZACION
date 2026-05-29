# Resumen del Proyecto: FitoABC

## 1. Descripción General
**FitoABC** es una aplicación interactiva orientada a niños en etapa de alfabetización. Consiste en un sistema de aprendizaje guiado mediante un ida y vuelta entre el niño y el sistema, utilizando tecnologías de reconocimiento de voz (Speech-to-Text) y síntesis de voz (Text-to-Speech). La plataforma emplea un sistema de progresión por niveles de dificultad incremental, utilizando cuentos e ilustraciones infantiles, y mantiene la persistencia del progreso general y los puntos en el "registro maestro" de la base de datos.

## 2. Arquitectura Tecnológica
* **Backend:** Node.js (v20) con Express.
* **Base de Datos:** PostgreSQL.
* **Autenticación:** Clerk Auth (soporte para registro tradicional, validación vía webhook y middleware de protección de rutas).
* **Motor de Inteligencia Artificial (Voz):**
  * **STT (Escucha):** Motor **Vosk** corriendo localmente en el entorno Linux para lograr transcripciones offline rápidas y precisas (pre-procesando los audios temporales con FFmpeg).
  * **TTS (Habla):** API moderna de Google TTS (`google-tts-api`), descargando y procesando el audio directamente en la memoria RAM mediante `fetch` nativo para evitar latencias y bloqueos de escritura en disco.
* **Frontend (En inicio):** Ecosistema de React configurado con Vite, React Router, Axios y la biblioteca de iconografía infantil Lucide React.

## 3. Requerimientos Principales
* **Accesibilidad Visual:** Interfaz altamente amigable para niños, soporte para modo oscuro/claro y navegación totalmente intuitiva que permite comprender el sistema sin necesidad de saber leer.
* **Mecánica de Entrada/Salida:** Ingreso de respuestas por voz (micrófono) y texto; devoluciones habladas por parte de la IA.
* **Visualización Dinámica:** Las sílabas deben mostrarse en un tamaño muy grande y colorido, y la plataforma debe emitir su pronunciación adaptando las variaciones vocálicas. Las palabras cambiarán de color a medida que avanza la lectura.
* **Flujos (Paginación):** Inicio de sesión, Test Diagnóstico / Selección de Nivel, Pantalla de Clase y Devolución con estadísticas finales.
* **Pedagogía:** Sistema de correcciones amigables, sugerencias ante errores y opción de evaluar el nivel inicial del usuario mediante un test de lectura.

## 4. Estructura de Niveles
La dificultad escala progresivamente a lo largo de las sesiones:
1. Construcción de sílabas básicas (ma-me-mi).
2. Lectura de sílabas verdes dentro de palabras.
3. Ordenamiento de sílabas simples.
4. Lectura de palabras simples (recompensado con la aparición de la imagen correspondiente).
5. Sílabas complejas (brazo, tigre) y lectura de palabras asociadas.
6. Lectura de oraciones simples (ej. "el pato amarillo").
7. Preguntas de comprensión lectora sobre la oración.
8. Cuentos infantiles ilustrados cuyas imágenes se revelan a través de la lectura continua.

## 5. Gamificación y Asentamiento del Aprendizaje
Para mantener la atención y motivar la práctica constante, el sistema incorpora:
* Recompensas visuales inmediatas (imágenes que saltan al acertar palabras).
* Un ecosistema de **Insignias** de logros.
* Minijuegos complementarios: Ruleta con letras, Abrecajas (elección entre opciones) y Une las parejas.
* La compañía de una mascota propia y exclusiva de la aplicación.
* Consolidación de todos los puntos obtenidos durante estas actividades directamente en el "registro maestro" del jugador para realizar el seguimiento del progreso.

## 6. Estado Actual del Desarrollo
* **Fase 1 - Backend Base (Completada):** Estructura MVC finalizada. Rutas, controladores y modelos de usuarios, niveles, progreso, contenido y sesiones estabilizados. Triggers SQL configurados para evitar registros nulos.
* **Fase 2 - Motor de Voz (Completada):** Endpoints `/api/voice/listen` y `/api/voice/speak` funcionales y pulidos, operando de manera eficiente sin comprometer el almacenamiento en disco.
* **Fase 3 - Frontend (En curso):** Proyecto base inicializado y dependencias core instaladas, listo para comenzar con la estructuración de componentes visuales.

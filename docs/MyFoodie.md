# MyFoodie - Documento base del TFG

## Descripción general
MyFoodie es una propuesta de Trabajo de Fin de Grado en Ingeniería de Software centrada en la gestión inteligente de despensa, la planificación culinaria y la reducción del desperdicio alimentario. La solución plantea una plataforma que combina control de inventario, recomendaciones personalizadas, automatización mediante OCR y escaneo de códigos de barras, además de una dimensión social basada en recetas y comunidad.

Un aspecto obligatorio del proyecto es que **MyFoodie está orientado a dispositivos móviles**, tanto a nivel de experiencia de usuario como de implementación técnica. En este planteamiento, la aplicación se desarrollará con React Native para el frontend móvil y Spring Boot para el backend, lo que refuerza su enfoque mobile-first y una arquitectura moderna separada entre cliente y servidor.

## Contexto del problema
El proyecto parte del problema del desperdicio alimentario, destacando que una parte relevante se genera en los hogares por una planificación ineficiente de compras y comidas. A partir de ese contexto, MyFoodie se plantea como una herramienta para optimizar recursos, ahorrar tiempo y dinero, y fomentar hábitos de consumo más sostenibles.

La presentación también identifica varios dolores del usuario final: pérdida de alimentos por caducidad, compras duplicadas o desorganizadas, falta de tiempo para planificar comidas y ausencia de inspiración culinaria. Por ello, el TFG no se limita a una app de recetas, sino que propone una solución integral de apoyo a la organización alimentaria doméstica.

## Objetivo del TFG
El objetivo principal de MyFoodie es diseñar y desarrollar una plataforma software capaz de ayudar al usuario a gestionar su despensa de forma inteligente, automatizar tareas repetitivas y ofrecer recomendaciones útiles basadas en sus preferencias e inventario. A nivel académico, el proyecto permite abordar áreas clave de la Ingeniería de Software como arquitectura, experiencia de usuario, integración de servicios externos, escalabilidad e incorporación de técnicas de inteligencia artificial.

Además, el proyecto tiene una vocación claramente práctica y aplicada al entorno real, ya que busca mejorar la experiencia diaria del usuario en acciones frecuentes como añadir productos, controlar caducidades, generar listas de compra y descubrir recetas. Al estar orientado a móviles, el TFG prioriza la accesibilidad, la inmediatez de uso y una interacción sencilla adaptada a pantallas pequeñas y contextos de uso cotidianos.

## Propuesta de valor
La propuesta de valor de MyFoodie se apoya en cuatro pilares principales:

- Automatización inteligente mediante OCR de tickets y escaneo de códigos de barras para reducir la entrada manual de datos.
- Recomendación personalizada con algoritmos de machine learning que aprenden de los gustos del usuario y del estado de su despensa.
- Red social colaborativa para compartir recetas, descubrir nuevas ideas e interactuar con otros usuarios.
- Carrito de compra inteligente para generar listas basadas en necesidades reales y minimizar olvidos o compras duplicadas.

Esta combinación diferencia a MyFoodie de otras soluciones más centradas exclusivamente en recetas o en listas de compra, ya que integra organización doméstica, personalización e interacción social en una única plataforma.

## Público objetivo y posicionamiento
La propuesta identifica un mercado amplio dentro de las aplicaciones de cocina y gestión del hogar, con foco en familias urbanas, millennials solteros, generación Z, profesionales culinarios y otros perfiles interesados en la eficiencia y la sostenibilidad. Según la presentación, MyFoodie busca posicionarse frente a alternativas como Yummly, BigOven, Cookpad o MyFridgeFood, diferenciándose por unir gestión de despensa, automatización avanzada y funcionalidades sociales.

Este posicionamiento es relevante para el TFG porque justifica la viabilidad funcional del producto y su posible evolución futura más allá del prototipo académico. También refuerza que el proyecto no solo pretende resolver una necesidad técnica, sino cubrir una oportunidad real de mercado.

## Funcionalidades principales
La experiencia de usuario se organiza en cinco áreas funcionales principales dentro de la aplicación  :

| Funcionalidad | Descripción |
|---|---|
| Resumen de despensa (dashboard) | Vista general del inventario, alertas de caducidad y carrito de compra inteligente. |
| Control de despensa | Alta y gestión de productos mediante OCR, escaneo de códigos de barras o introducción manual. |
| Feed social de recetas | Exploración, búsqueda e interacción con recetas de la comunidad, junto con recomendaciones personalizadas. |
| Crear y publicar recetas | Formulario para compartir ingredientes, pasos y fotos de nuevas recetas  . |
| Perfil de usuario | Gestión de datos personales, estadísticas, historial de compras y preferencias de privacidad. |

Estas funcionalidades muestran que el sistema combina casos de uso utilitarios y sociales dentro de una misma aplicación móvil  . Desde el punto de vista del TFG, esto permite trabajar tanto la lógica de negocio como el diseño de interfaz y la persistencia de datos.

## Arquitectura del sistema
La arquitectura propuesta para MyFoodie sigue un enfoque de servicios desacoplados, pensado para ofrecer eficiencia, escalabilidad y seguridad. A nivel de implementación, el frontend se desarrollará en React Native como aplicación móvil multiplataforma, mientras que el backend se construirá con Spring Boot para exponer la lógica de negocio, la autenticación, la gestión del inventario, las recetas y las recomendaciones.

En la capa de datos, la presentación plantea el uso de MongoDB y Redis, además de integración con servicios externos como Google Vision API y AWS S3. Con esta base, el sistema puede organizarse mediante una API que conecte la app móvil con servicios especializados de procesamiento, almacenamiento y automatización.

## Tecnologías e inteligencia artificial
Desde una perspectiva actualizada del proyecto, el stack principal queda definido por React Native en el cliente móvil y Spring Boot en el servidor. Esto permite separar claramente la experiencia móvil de la lógica backend, facilitando la mantenibilidad, el escalado y la futura ampliación del sistema.

Junto a estas tecnologías, la propuesta contempla una base técnica con MongoDB, Redis, JWT, OAuth2, Google Vision API, Firebase ML Kit y servicios cloud de AWS. En el apartado de IA, se definen tres líneas principales: OCR de tickets, recomendador híbrido de recetas y carrito de compra inteligente orientado a minimizar faltantes y optimizar decisiones de compra.

## Modelo de negocio
La propuesta contempla un modelo freemium con distintas vías de monetización, incluyendo suscripciones, publicidad contextual, afiliación con supermercados, venta de recetas premium, contenido exclusivo y posibles APIs B2B o explotación de datos anonimizados. La presentación proyecta para el tercer año 3 millones de euros en ingresos, una conversión premium del 12% y 750.000 usuarios registrados.

A nivel de estrategia de crecimiento, se plantea un soft launch y beta en España, colaboración con influencers culinarios, expansión geográfica a mercados europeos y alianzas con minoristas y chefs  . Aunque estas cifras forman parte de una visión prospectiva, son útiles dentro del documento del TFG para explicar la sostenibilidad y proyección del producto.

## Roadmap de desarrollo
El roadmap del proyecto se divide en tres horizontes temporales:

- Corto plazo: autenticación, perfiles de usuario, gestión básica de despensa y base de datos de recetas.
- Medio plazo: publicación de recetas, algoritmo de recomendación, feed social y carrito de compra inteligente.
- Largo plazo: OCR de tickets, recomendaciones avanzadas, integración con supermercados y expansión a nuevos mercados.

Esta planificación ayuda a delimitar el alcance del TFG y a separar claramente el producto mínimo viable de las funcionalidades futuras. En un contexto académico, este roadmap también permite justificar prioridades y fases de implementación.

## Impacto esperado
La presentación atribuye a MyFoodie un impacto social relacionado con la reducción del desperdicio alimentario, el ahorro económico para las familias, la sostenibilidad ambiental y la creación de comunidad culinaria  . En concreto, se menciona una posible reducción del desperdicio del 20% al 30% y un ahorro mensual estimado de entre 50 y 100 euros para las familias.

Más allá de las cifras proyectadas, el valor del proyecto reside en su capacidad para convertir información dispersa del hogar en decisiones más eficientes y conscientes. Esto refuerza el interés del TFG tanto por su aplicación tecnológica como por su posible impacto social.
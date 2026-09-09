package com.myfoodie.infrastructure.seed;

import java.util.List;

public final class RecetaSeedData {

    private RecetaSeedData() {}

    public record Ingrediente(String nombre, double cantidad, String unidad) {}

    public record Receta(
            String titulo,
            String descripcion,
            int tiempoEstimado,
            String dificultad,
            String categoria,
            List<String> etiquetas,
            String imagenUrl,
            List<Ingrediente> ingredientes,
            List<String> pasos
    ) {}

    public static List<Receta> recetas() {
        return List.of(
                new Receta(
                        "Tortilla de patatas",
                        "La clásica tortilla española, jugosa por dentro y dorada por fuera.",
                        40, "Media", "Almuerzo", List.of("vegetariano", "económico", "tradicional"), "/recetas/tortilla-de-patatas.jpg",
                        List.of(
                                new Ingrediente("Patatas", 4, "unidades"),
                                new Ingrediente("Huevos", 6, "unidades"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Aceite de oliva", 200, "ml"),
                                new Ingrediente("Sal", 1, "al gusto")
                        ),
                        List.of(
                                "Pelar y cortar las patatas y la cebolla en láminas finas.",
                                "Freír a fuego medio en abundante aceite de oliva hasta que estén tiernas.",
                                "Batir los huevos con sal y mezclar con las patatas escurridas.",
                                "Cuajar la tortilla en la sartén por ambos lados hasta el punto deseado."
                        )
                ),
                new Receta(
                        "Ensalada de tomate y pepino",
                        "Ensalada fresca y ligera, ideal para los días de calor.",
                        10, "Fácil", "Entrante", List.of("vegetariano", "vegano", "rápido", "saludable"), "/recetas/ensalada-de-tomate-y-pepino.jpg",
                        List.of(
                                new Ingrediente("Tomate", 3, "unidades"),
                                new Ingrediente("Pepino", 1, "unidad"),
                                new Ingrediente("Cebolla", 0.5, "unidad"),
                                new Ingrediente("Aceite de oliva", 2, "cucharadas"),
                                new Ingrediente("Sal", 1, "al gusto")
                        ),
                        List.of(
                                "Cortar el tomate y el pepino en dados.",
                                "Picar la cebolla en juliana fina.",
                                "Mezclar todo en un bol y aliñar con aceite y sal."
                        )
                ),
                new Receta(
                        "Arroz con pollo",
                        "Arroz meloso con pollo, pimiento y un buen caldo casero.",
                        45, "Media", "Almuerzo", List.of("tradicional", "proteico"), "/recetas/arroz-con-pollo.jpg",
                        List.of(
                                new Ingrediente("Arroz", 300, "g"),
                                new Ingrediente("Pollo", 400, "g"),
                                new Ingrediente("Pimiento", 1, "unidad"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Ajo", 2, "dientes"),
                                new Ingrediente("Caldo de pollo", 600, "ml")
                        ),
                        List.of(
                                "Dorar el pollo troceado en una cazuela con aceite.",
                                "Añadir la cebolla, el pimiento y el ajo picados y sofreír.",
                                "Incorporar el arroz y remover un par de minutos.",
                                "Verter el caldo caliente y cocer a fuego medio hasta que el arroz esté en su punto."
                        )
                ),
                new Receta(
                        "Pasta con tomate",
                        "Receta sencilla y rápida para cualquier día de la semana.",
                        20, "Fácil", "Cena", List.of("vegetariano", "rápido", "económico"), "/recetas/pasta-con-tomate.jpg",
                        List.of(
                                new Ingrediente("Pasta", 300, "g"),
                                new Ingrediente("Tomate", 4, "unidades"),
                                new Ingrediente("Ajo", 2, "dientes"),
                                new Ingrediente("Aceite de oliva", 3, "cucharadas"),
                                new Ingrediente("Albahaca", 1, "al gusto")
                        ),
                        List.of(
                                "Cocer la pasta en agua con sal siguiendo el tiempo del paquete.",
                                "Sofreír el ajo laminado y añadir el tomate triturado.",
                                "Cocinar la salsa a fuego medio 10 minutos y mezclar con la pasta escurrida."
                        )
                ),
                new Receta(
                        "Tostada con aguacate y huevo",
                        "Desayuno completo, rápido y saludable.",
                        10, "Fácil", "Desayuno", List.of("vegetariano", "rápido", "saludable"), "/recetas/tostada-con-aguacate-y-huevo.jpg",
                        List.of(
                                new Ingrediente("Pan", 2, "rebanadas"),
                                new Ingrediente("Aguacate", 1, "unidad"),
                                new Ingrediente("Huevos", 1, "unidad"),
                                new Ingrediente("Limón", 0.5, "unidad"),
                                new Ingrediente("Sal", 1, "al gusto")
                        ),
                        List.of(
                                "Tostar el pan hasta que quede crujiente.",
                                "Machacar el aguacate con sal y unas gotas de limón.",
                                "Freír o escalfar el huevo y colocarlo sobre la tostada con el aguacate."
                        )
                ),
                new Receta(
                        "Gazpacho andaluz",
                        "Sopa fría de verduras, perfecta para el verano.",
                        15, "Fácil", "Entrante", List.of("vegetariano", "vegano", "sin gluten", "saludable"), "/recetas/gazpacho-andaluz.jpg",
                        List.of(
                                new Ingrediente("Tomate", 6, "unidades"),
                                new Ingrediente("Pepino", 1, "unidad"),
                                new Ingrediente("Pimiento", 1, "unidad"),
                                new Ingrediente("Ajo", 1, "diente"),
                                new Ingrediente("Aceite de oliva", 4, "cucharadas")
                        ),
                        List.of(
                                "Trocear todas las verduras.",
                                "Triturar junto con el aceite y un poco de agua fría hasta obtener una crema fina.",
                                "Colar si se desea una textura más suave y enfriar antes de servir."
                        )
                ),
                new Receta(
                        "Huevos revueltos con champiñones",
                        "Un desayuno o cena ligera lista en minutos.",
                        15, "Fácil", "Desayuno", List.of("vegetariano", "rápido", "proteico"), "/recetas/huevos-revueltos-con-champinones.jpg",
                        List.of(
                                new Ingrediente("Huevos", 4, "unidades"),
                                new Ingrediente("Champiñones", 200, "g"),
                                new Ingrediente("Cebolla", 0.5, "unidad"),
                                new Ingrediente("Aceite de oliva", 2, "cucharadas")
                        ),
                        List.of(
                                "Laminar los champiñones y picar la cebolla.",
                                "Sofreír la cebolla y los champiñones hasta que doren.",
                                "Añadir los huevos batidos y remover a fuego suave hasta cuajar."
                        )
                ),
                new Receta(
                        "Sopa de verduras",
                        "Sopa reconfortante con lo que tengas en la despensa.",
                        30, "Fácil", "Entrante", List.of("vegetariano", "vegano", "sin gluten", "saludable"), "/recetas/sopa-de-verduras.jpg",
                        List.of(
                                new Ingrediente("Zanahoria", 2, "unidades"),
                                new Ingrediente("Patatas", 2, "unidades"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Apio", 1, "unidad"),
                                new Ingrediente("Caldo de verduras", 1, "litro")
                        ),
                        List.of(
                                "Trocear todas las verduras en dados pequeños.",
                                "Rehogar la cebolla y el apio en una olla con un poco de aceite.",
                                "Añadir el resto de verduras y el caldo, y cocer 20 minutos."
                        )
                ),
                new Receta(
                        "Lentejas estofadas",
                        "Plato de cuchara tradicional, ideal para los días de frío.",
                        50, "Media", "Almuerzo", List.of("vegetariano", "vegano", "económico", "tradicional"), "/recetas/lentejas-estofadas.jpg",
                        List.of(
                                new Ingrediente("Lentejas", 300, "g"),
                                new Ingrediente("Zanahoria", 2, "unidades"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Ajo", 2, "dientes"),
                                new Ingrediente("Pimiento", 1, "unidad")
                        ),
                        List.of(
                                "Sofreír la cebolla, el ajo y el pimiento picados.",
                                "Añadir las lentejas y la zanahoria en rodajas.",
                                "Cubrir con agua y cocer a fuego medio hasta que las lentejas estén tiernas."
                        )
                ),
                new Receta(
                        "Pisto manchego",
                        "Verduras de temporada guisadas lentamente en su propio jugo.",
                        40, "Media", "Cena", List.of("vegetariano", "vegano", "sin gluten", "tradicional"), "/recetas/pisto-manchego.jpg",
                        List.of(
                                new Ingrediente("Calabacín", 2, "unidades"),
                                new Ingrediente("Pimiento", 2, "unidades"),
                                new Ingrediente("Tomate", 4, "unidades"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Aceite de oliva", 3, "cucharadas")
                        ),
                        List.of(
                                "Cortar todas las verduras en dados.",
                                "Sofreír la cebolla y el pimiento a fuego medio.",
                                "Añadir el calabacín y el tomate, y cocinar a fuego lento hasta que estén tiernos."
                        )
                ),
                new Receta(
                        "Pollo al horno con patatas",
                        "Receta clásica de domingo, fácil y para toda la familia.",
                        60, "Media", "Cena", List.of("tradicional", "proteico"), "/recetas/pollo-al-horno-con-patatas.jpg",
                        List.of(
                                new Ingrediente("Pollo", 1, "unidad"),
                                new Ingrediente("Patatas", 4, "unidades"),
                                new Ingrediente("Ajo", 4, "dientes"),
                                new Ingrediente("Aceite de oliva", 3, "cucharadas"),
                                new Ingrediente("Romero", 1, "al gusto")
                        ),
                        List.of(
                                "Salpimentar el pollo y colocarlo en una bandeja con las patatas cascadas.",
                                "Añadir los dientes de ajo, el romero y el aceite de oliva.",
                                "Hornear a 200°C durante 50-60 minutos hasta que esté dorado."
                        )
                ),
                new Receta(
                        "Salmón a la plancha con verduras",
                        "Plato ligero y rápido, rico en proteína.",
                        25, "Fácil", "Cena", List.of("sin gluten", "saludable", "proteico"), "/recetas/salmon-a-la-plancha-con-verduras.jpg",
                        List.of(
                                new Ingrediente("Salmón", 2, "unidades"),
                                new Ingrediente("Calabacín", 1, "unidad"),
                                new Ingrediente("Zanahoria", 1, "unidad"),
                                new Ingrediente("Limón", 1, "unidad"),
                                new Ingrediente("Aceite de oliva", 2, "cucharadas")
                        ),
                        List.of(
                                "Cortar el calabacín y la zanahoria en tiras finas y saltear.",
                                "Salpimentar el salmón y marcarlo en la plancha por ambos lados.",
                                "Servir el salmón sobre las verduras con un chorrito de limón."
                        )
                ),
                new Receta(
                        "Hummus casero",
                        "Crema de garbanzos suave, perfecta para untar o picar.",
                        15, "Fácil", "Snack", List.of("vegetariano", "vegano", "sin gluten", "saludable"), "/recetas/hummus-casero.jpg",
                        List.of(
                                new Ingrediente("Garbanzos", 400, "g"),
                                new Ingrediente("Ajo", 1, "diente"),
                                new Ingrediente("Limón", 1, "unidad"),
                                new Ingrediente("Aceite de oliva", 3, "cucharadas"),
                                new Ingrediente("Tahini", 2, "cucharadas")
                        ),
                        List.of(
                                "Escurrir los garbanzos cocidos.",
                                "Triturar junto con el ajo, el limón, el tahini y el aceite hasta obtener una crema.",
                                "Ajustar de sal y textura añadiendo agua si es necesario."
                        )
                ),
                new Receta(
                        "Ensalada de garbanzos",
                        "Ensalada completa y saciante, ideal para el mediodía.",
                        15, "Fácil", "Entrante", List.of("vegetariano", "vegano", "saludable", "económico"), "/recetas/ensalada-de-garbanzos.jpg",
                        List.of(
                                new Ingrediente("Garbanzos", 300, "g"),
                                new Ingrediente("Tomate", 2, "unidades"),
                                new Ingrediente("Cebolla", 0.5, "unidad"),
                                new Ingrediente("Pimiento", 1, "unidad"),
                                new Ingrediente("Aceite de oliva", 2, "cucharadas")
                        ),
                        List.of(
                                "Cortar el tomate, la cebolla y el pimiento en dados pequeños.",
                                "Mezclar con los garbanzos escurridos.",
                                "Aliñar con aceite de oliva y sal al gusto."
                        )
                ),
                new Receta(
                        "Arroz con verduras",
                        "Arroz colorido y ligero con verduras salteadas.",
                        30, "Fácil", "Almuerzo", List.of("vegetariano", "vegano", "económico"), "/recetas/arroz-con-verduras.jpg",
                        List.of(
                                new Ingrediente("Arroz", 250, "g"),
                                new Ingrediente("Zanahoria", 1, "unidad"),
                                new Ingrediente("Guisantes", 100, "g"),
                                new Ingrediente("Pimiento", 1, "unidad"),
                                new Ingrediente("Cebolla", 1, "unidad")
                        ),
                        List.of(
                                "Cocer el arroz según las instrucciones del paquete.",
                                "Saltear la cebolla, el pimiento, la zanahoria y los guisantes.",
                                "Mezclar el arroz cocido con las verduras salteadas."
                        )
                ),
                new Receta(
                        "Quiche de espinacas",
                        "Tarta salada cremosa, perfecta para comer fría o caliente.",
                        55, "Media", "Cena", List.of("vegetariano", "tradicional"), "/recetas/quiche-de-espinacas.jpg",
                        List.of(
                                new Ingrediente("Espinacas", 300, "g"),
                                new Ingrediente("Huevos", 4, "unidades"),
                                new Ingrediente("Queso", 150, "g"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Masa quebrada", 1, "unidad")
                        ),
                        List.of(
                                "Forrar un molde con la masa quebrada.",
                                "Rehogar las espinacas con la cebolla picada.",
                                "Batir los huevos con el queso, mezclar con las espinacas y verter sobre la masa.",
                                "Hornear a 180°C durante 30-35 minutos hasta que cuaje."
                        )
                ),
                new Receta(
                        "Crema de calabaza",
                        "Crema suave y reconfortante, ideal para el otoño.",
                        30, "Fácil", "Entrante", List.of("vegetariano", "vegano", "sin gluten", "saludable"), "/recetas/crema-de-calabaza.jpg",
                        List.of(
                                new Ingrediente("Calabaza", 500, "g"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Caldo de verduras", 500, "ml"),
                                new Ingrediente("Aceite de oliva", 2, "cucharadas")
                        ),
                        List.of(
                                "Trocear la calabaza y la cebolla.",
                                "Rehogar la cebolla y añadir la calabaza y el caldo.",
                                "Cocer 20 minutos y triturar hasta obtener una crema fina."
                        )
                ),
                new Receta(
                        "Macarrones con atún",
                        "Receta rápida y económica, siempre un acierto.",
                        20, "Fácil", "Almuerzo", List.of("rápido", "económico", "proteico"), "/recetas/macarrones-con-atun.jpg",
                        List.of(
                                new Ingrediente("Pasta", 300, "g"),
                                new Ingrediente("Atún", 2, "latas"),
                                new Ingrediente("Tomate", 3, "unidades"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Aceite de oliva", 2, "cucharadas")
                        ),
                        List.of(
                                "Cocer la pasta según las instrucciones del paquete.",
                                "Sofreír la cebolla y añadir el tomate triturado.",
                                "Incorporar el atún escurrido y mezclar con la pasta cocida."
                        )
                ),
                new Receta(
                        "Wrap de pollo y verduras",
                        "Ideal para llevar o para una cena ligera.",
                        15, "Fácil", "Snack", List.of("rápido", "proteico"), "/recetas/wrap-de-pollo-y-verduras.jpg",
                        List.of(
                                new Ingrediente("Pollo", 200, "g"),
                                new Ingrediente("Tortilla de trigo", 2, "unidades"),
                                new Ingrediente("Lechuga", 1, "unidad"),
                                new Ingrediente("Tomate", 1, "unidad"),
                                new Ingrediente("Queso", 50, "g")
                        ),
                        List.of(
                                "Cocinar el pollo a la plancha y cortarlo en tiras.",
                                "Calentar ligeramente las tortillas de trigo.",
                                "Rellenar con el pollo, la lechuga, el tomate y el queso, y enrollar."
                        )
                ),
                new Receta(
                        "Tarta de manzana",
                        "Postre casero clásico, con manzanas caramelizadas por encima.",
                        60, "Media", "Postre", List.of("vegetariano", "dulce", "tradicional"), "/recetas/tarta-de-manzana.jpg",
                        List.of(
                                new Ingrediente("Manzana", 4, "unidades"),
                                new Ingrediente("Harina", 250, "g"),
                                new Ingrediente("Huevos", 2, "unidades"),
                                new Ingrediente("Azúcar", 150, "g"),
                                new Ingrediente("Mantequilla", 100, "g")
                        ),
                        List.of(
                                "Preparar una masa con la harina, la mantequilla, el azúcar y los huevos.",
                                "Extender la masa en un molde y cubrir con las manzanas laminadas.",
                                "Hornear a 180°C durante 40-45 minutos hasta que esté dorada."
                        )
                ),
                new Receta(
                        "Sándwich mixto",
                        "El clásico bocadillo de jamón y queso, listo en un momento.",
                        5, "Fácil", "Snack", List.of("rápido", "apto niños"), "/recetas/sandwich-mixto.jpg",
                        List.of(
                                new Ingrediente("Pan de molde", 2, "rebanadas"),
                                new Ingrediente("Jamón cocido", 2, "lonchas"),
                                new Ingrediente("Queso", 2, "lonchas"),
                                new Ingrediente("Mantequilla", 10, "g")
                        ),
                        List.of(
                                "Untar el pan con un poco de mantequilla.",
                                "Colocar el jamón y el queso entre las rebanadas.",
                                "Tostar en la sartén o sandwichera hasta que el queso funda."
                        )
                ),
                new Receta(
                        "Batido de plátano y avena",
                        "Batido energético y fácil, perfecto para el desayuno de los más pequeños.",
                        5, "Fácil", "Bebida", List.of("vegetariano", "rápido", "apto niños", "saludable"), "/recetas/batido-de-platano-y-avena.jpg",
                        List.of(
                                new Ingrediente("Plátano", 1, "unidad"),
                                new Ingrediente("Leche", 200, "ml"),
                                new Ingrediente("Avena", 30, "g"),
                                new Ingrediente("Miel", 1, "cucharada")
                        ),
                        List.of(
                                "Trocear el plátano.",
                                "Triturar todos los ingredientes juntos hasta obtener una mezcla homogénea.",
                                "Servir bien frío."
                        )
                ),
                new Receta(
                        "Palomitas caseras",
                        "Snack sencillo y económico para ver una película en familia.",
                        10, "Fácil", "Snack", List.of("vegano", "rápido", "apto niños", "económico"), "/recetas/palomitas-caseras.jpg",
                        List.of(
                                new Ingrediente("Maíz para palomitas", 80, "g"),
                                new Ingrediente("Aceite de oliva", 1, "cucharada"),
                                new Ingrediente("Sal", 1, "al gusto")
                        ),
                        List.of(
                                "Calentar el aceite en una olla con tapa a fuego medio-alto.",
                                "Añadir el maíz, tapar y agitar la olla de vez en cuando.",
                                "Retirar del fuego cuando dejen de sonar los estallidos y salar al gusto."
                        )
                ),
                new Receta(
                        "Macedonia de frutas",
                        "Postre fresco y colorido, fácil de preparar con los peques de casa.",
                        10, "Fácil", "Postre", List.of("vegano", "saludable", "apto niños"), "/recetas/macedonia-de-frutas.jpg",
                        List.of(
                                new Ingrediente("Manzana", 1, "unidad"),
                                new Ingrediente("Plátano", 1, "unidad"),
                                new Ingrediente("Naranja", 1, "unidad"),
                                new Ingrediente("Uvas", 100, "g")
                        ),
                        List.of(
                                "Pelar y cortar toda la fruta en trozos pequeños.",
                                "Mezclar en un bol grande.",
                                "Enfriar en la nevera antes de servir."
                        )
                ),
                new Receta(
                        "Yogur con granola y frutos rojos",
                        "Desayuno rápido, nutritivo y muy fácil de personalizar.",
                        5, "Fácil", "Desayuno", List.of("vegetariano", "rápido", "saludable", "apto niños"), "/recetas/yogur-con-granola-y-frutos-rojos.jpg",
                        List.of(
                                new Ingrediente("Yogur natural", 2, "unidades"),
                                new Ingrediente("Granola", 60, "g"),
                                new Ingrediente("Frutos rojos", 100, "g"),
                                new Ingrediente("Miel", 1, "cucharada")
                        ),
                        List.of(
                                "Servir el yogur en un bol o vaso.",
                                "Añadir la granola y los frutos rojos por encima.",
                                "Terminar con un hilo de miel."
                        )
                ),
                new Receta(
                        "Quesadillas de queso",
                        "Receta rapidísima que encanta a los más pequeños de la casa.",
                        10, "Fácil", "Snack", List.of("vegetariano", "rápido", "apto niños"), "/recetas/quesadillas-de-queso.jpg",
                        List.of(
                                new Ingrediente("Tortilla de trigo", 2, "unidades"),
                                new Ingrediente("Queso", 100, "g"),
                                new Ingrediente("Aceite de oliva", 1, "cucharada")
                        ),
                        List.of(
                                "Rellenar una tortilla con el queso rallado y cubrir con la otra.",
                                "Calentar una sartén con un poco de aceite.",
                                "Dorar la quesadilla por ambos lados hasta que el queso funda."
                        )
                ),
                new Receta(
                        "Curry de garbanzos y espinacas",
                        "Curry vegetal cremoso con un toque de leche de coco.",
                        35, "Media", "Cena", List.of("vegano", "picante", "internacional"), "/recetas/curry-de-garbanzos-y-espinacas.jpg",
                        List.of(
                                new Ingrediente("Garbanzos", 400, "g"),
                                new Ingrediente("Espinacas", 200, "g"),
                                new Ingrediente("Leche de coco", 200, "ml"),
                                new Ingrediente("Curry en polvo", 1, "cucharada"),
                                new Ingrediente("Cebolla", 1, "unidad")
                        ),
                        List.of(
                                "Sofreír la cebolla picada hasta que esté transparente.",
                                "Añadir el curry en polvo y remover un minuto.",
                                "Incorporar los garbanzos, la leche de coco y cocer 15 minutos.",
                                "Añadir las espinacas al final y dejar que se cocinen unos minutos."
                        )
                ),
                new Receta(
                        "Tacos de pollo picante",
                        "Tacos mexicanos con un toque picante, listos en media hora.",
                        30, "Media", "Cena", List.of("picante", "proteico", "internacional"), "/recetas/tacos-de-pollo-picante.jpg",
                        List.of(
                                new Ingrediente("Pollo", 300, "g"),
                                new Ingrediente("Tortilla de maíz", 6, "unidades"),
                                new Ingrediente("Pimiento", 1, "unidad"),
                                new Ingrediente("Salsa picante", 2, "cucharadas"),
                                new Ingrediente("Cebolla", 1, "unidad")
                        ),
                        List.of(
                                "Cortar el pollo en tiras y saltear con la cebolla y el pimiento.",
                                "Añadir la salsa picante y cocinar unos minutos más.",
                                "Calentar las tortillas de maíz y rellenar con el pollo."
                        )
                ),
                new Receta(
                        "Ramen casero",
                        "Sopa japonesa de fideos con un caldo intenso y huevo marinado.",
                        90, "Difícil", "Cena", List.of("proteico", "internacional", "tradicional"), "/recetas/ramen-casero.jpg",
                        List.of(
                                new Ingrediente("Fideos ramen", 200, "g"),
                                new Ingrediente("Huevos", 2, "unidades"),
                                new Ingrediente("Pollo", 200, "g"),
                                new Ingrediente("Salsa de soja", 3, "cucharadas"),
                                new Ingrediente("Caldo de pollo", 800, "ml")
                        ),
                        List.of(
                                "Cocer los huevos, pelarlos y marinarlos en salsa de soja.",
                                "Cocinar el pollo en el caldo hasta que esté tierno y reservar.",
                                "Cocer los fideos aparte según las instrucciones del paquete.",
                                "Montar el bol con el caldo, los fideos, el pollo y el huevo marinado."
                        )
                ),
                new Receta(
                        "Sushi de salmón y aguacate",
                        "Makis caseros con salmón fresco y aguacate cremoso.",
                        75, "Difícil", "Cena", List.of("saludable", "internacional", "proteico"), "/recetas/sushi-de-salmon-y-aguacate.jpg",
                        List.of(
                                new Ingrediente("Arroz", 300, "g"),
                                new Ingrediente("Salmón", 200, "g"),
                                new Ingrediente("Aguacate", 1, "unidad"),
                                new Ingrediente("Alga nori", 4, "unidades"),
                                new Ingrediente("Vinagre de arroz", 2, "cucharadas")
                        ),
                        List.of(
                                "Cocer el arroz y aliñarlo con el vinagre de arroz.",
                                "Cortar el salmón y el aguacate en tiras finas.",
                                "Extender el arroz sobre el alga nori y colocar el relleno.",
                                "Enrollar con firmeza y cortar en piezas con un cuchillo húmedo."
                        )
                ),
                new Receta(
                        "Pad thai de pollo",
                        "Fideos de arroz salteados al estilo tailandés.",
                        35, "Media", "Cena", List.of("internacional", "picante", "proteico"), "/recetas/pad-thai-de-pollo.jpg",
                        List.of(
                                new Ingrediente("Fideos de arroz", 250, "g"),
                                new Ingrediente("Pollo", 200, "g"),
                                new Ingrediente("Huevos", 2, "unidades"),
                                new Ingrediente("Cacahuetes", 50, "g"),
                                new Ingrediente("Salsa de soja", 2, "cucharadas")
                        ),
                        List.of(
                                "Remojar los fideos de arroz según las instrucciones del paquete.",
                                "Saltear el pollo troceado hasta que esté dorado.",
                                "Añadir el huevo batido y los fideos, y saltear todo junto.",
                                "Incorporar la salsa de soja y servir con los cacahuetes picados por encima."
                        )
                ),
                new Receta(
                        "Paella valenciana",
                        "El plato español por excelencia, con pollo, conejo y judía verde.",
                        90, "Difícil", "Almuerzo", List.of("tradicional", "mediterráneo", "proteico"), "/recetas/paella-valenciana.jpg",
                        List.of(
                                new Ingrediente("Arroz", 400, "g"),
                                new Ingrediente("Pollo", 300, "g"),
                                new Ingrediente("Conejo", 300, "g"),
                                new Ingrediente("Judía verde", 150, "g"),
                                new Ingrediente("Azafrán", 1, "al gusto")
                        ),
                        List.of(
                                "Dorar el pollo y el conejo en la paellera con aceite.",
                                "Añadir la judía verde y sofreír unos minutos.",
                                "Incorporar el arroz, el azafrán y el caldo caliente.",
                                "Cocer sin remover hasta que el arroz absorba el líquido y dejar reposar."
                        )
                ),
                new Receta(
                        "Risotto de setas",
                        "Arroz cremoso al estilo italiano con setas de temporada.",
                        50, "Difícil", "Cena", List.of("vegetariano", "tradicional", "mediterráneo"), "/recetas/risotto-de-setas.jpg",
                        List.of(
                                new Ingrediente("Arroz", 300, "g"),
                                new Ingrediente("Setas", 250, "g"),
                                new Ingrediente("Caldo de verduras", 800, "ml"),
                                new Ingrediente("Queso", 80, "g"),
                                new Ingrediente("Cebolla", 1, "unidad")
                        ),
                        List.of(
                                "Sofreír la cebolla picada y las setas laminadas.",
                                "Añadir el arroz y nacararlo un par de minutos.",
                                "Incorporar el caldo caliente poco a poco, removiendo constantemente.",
                                "Terminar con el queso rallado fuera del fuego para dar cremosidad."
                        )
                ),
                new Receta(
                        "Solomillo Wellington",
                        "Solomillo envuelto en hojaldre con duxelles de champiñones y jamón.",
                        120, "Difícil", "Cena", List.of("proteico", "tradicional"), "/recetas/solomillo-wellington.jpg",
                        List.of(
                                new Ingrediente("Solomillo de ternera", 600, "g"),
                                new Ingrediente("Masa de hojaldre", 1, "unidad"),
                                new Ingrediente("Champiñones", 300, "g"),
                                new Ingrediente("Jamón serrano", 100, "g"),
                                new Ingrediente("Mostaza", 1, "cucharada")
                        ),
                        List.of(
                                "Sellar el solomillo en una sartén muy caliente por todos los lados.",
                                "Picar y cocinar los champiñones hasta evaporar todo el líquido.",
                                "Envolver el solomillo con mostaza, jamón, champiñones y la masa de hojaldre.",
                                "Hornear a 200°C durante 25-30 minutos y dejar reposar antes de cortar."
                        )
                ),
                new Receta(
                        "Soufflé de queso",
                        "Postre salado esponjoso, todo un reto de repostería.",
                        55, "Difícil", "Postre", List.of("vegetariano", "tradicional"), "/recetas/souffle-de-queso.jpg",
                        List.of(
                                new Ingrediente("Huevos", 4, "unidades"),
                                new Ingrediente("Queso", 150, "g"),
                                new Ingrediente("Mantequilla", 50, "g"),
                                new Ingrediente("Harina", 50, "g"),
                                new Ingrediente("Leche", 250, "ml")
                        ),
                        List.of(
                                "Preparar una bechamel con la mantequilla, la harina y la leche.",
                                "Añadir el queso rallado y las yemas a la bechamel templada.",
                                "Montar las claras a punto de nieve e incorporarlas con cuidado.",
                                "Hornear en moldes individuales a 190°C durante 20-25 minutos sin abrir el horno."
                        )
                ),
                new Receta(
                        "Ceviche de corvina",
                        "Pescado marinado en cítricos al estilo latinoamericano.",
                        30, "Difícil", "Entrante", List.of("saludable", "sin gluten", "internacional"), "/recetas/ceviche-de-corvina.jpg",
                        List.of(
                                new Ingrediente("Corvina", 300, "g"),
                                new Ingrediente("Limón", 4, "unidades"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Cilantro", 1, "al gusto"),
                                new Ingrediente("Pimiento", 1, "unidad")
                        ),
                        List.of(
                                "Cortar el pescado en dados pequeños y muy frescos.",
                                "Cubrir con el zumo de limón y dejar marinar 15-20 minutos en la nevera.",
                                "Añadir la cebolla en juliana fina, el pimiento y el cilantro picado.",
                                "Servir bien frío."
                        )
                ),
                new Receta(
                        "Tarta de chocolate y avellana",
                        "Postre denso y elegante para los amantes del chocolate.",
                        90, "Difícil", "Postre", List.of("vegetariano", "dulce", "tradicional"), "/recetas/tarta-de-chocolate-y-avellana.jpg",
                        List.of(
                                new Ingrediente("Chocolate negro", 200, "g"),
                                new Ingrediente("Avellanas", 100, "g"),
                                new Ingrediente("Huevos", 3, "unidades"),
                                new Ingrediente("Mantequilla", 150, "g"),
                                new Ingrediente("Azúcar", 150, "g")
                        ),
                        List.of(
                                "Derretir el chocolate junto con la mantequilla al baño maría.",
                                "Batir los huevos con el azúcar hasta que blanqueen.",
                                "Mezclar todo junto con las avellanas picadas.",
                                "Hornear a 170°C durante 30-35 minutos y dejar enfriar antes de desmoldar."
                        )
                ),
                new Receta(
                        "Confit de pato",
                        "Muslos de pato cocinados lentamente en su propia grasa.",
                        150, "Difícil", "Cena", List.of("proteico", "tradicional"), "/recetas/confit-de-pato.jpg",
                        List.of(
                                new Ingrediente("Muslos de pato", 4, "unidades"),
                                new Ingrediente("Ajo", 6, "dientes"),
                                new Ingrediente("Tomillo", 1, "al gusto"),
                                new Ingrediente("Aceite de oliva", 300, "ml"),
                                new Ingrediente("Sal", 1, "al gusto")
                        ),
                        List.of(
                                "Salar los muslos de pato y dejar reposar unas horas en la nevera.",
                                "Cocinar a fuego muy suave cubiertos de aceite con el ajo y el tomillo.",
                                "Confitar durante unas 2 horas hasta que la carne esté muy tierna.",
                                "Terminar dorando la piel en una sartén caliente antes de servir."
                        )
                ),
                new Receta(
                        "Bizcocho de yogur",
                        "El bizcocho casero de toda la vida, esponjoso y fácil de hacer.",
                        45, "Fácil", "Postre", List.of("vegetariano", "dulce", "apto niños", "económico"), "/recetas/bizcocho-de-yogur.jpg",
                        List.of(
                                new Ingrediente("Yogur natural", 1, "unidad"),
                                new Ingrediente("Harina", 300, "g"),
                                new Ingrediente("Huevos", 3, "unidades"),
                                new Ingrediente("Azúcar", 200, "g"),
                                new Ingrediente("Aceite de oliva", 150, "ml")
                        ),
                        List.of(
                                "Mezclar el yogur, los huevos, el azúcar y el aceite.",
                                "Añadir la harina tamizada y mezclar hasta integrar.",
                                "Verter en un molde engrasado y hornear a 180°C durante 35-40 minutos."
                        )
                ),
                new Receta(
                        "Crepes dulces",
                        "Crepes finas y versátiles, perfectas para rellenar al gusto.",
                        20, "Fácil", "Desayuno", List.of("vegetariano", "dulce", "apto niños"), "/recetas/crepes-dulces.jpg",
                        List.of(
                                new Ingrediente("Harina", 200, "g"),
                                new Ingrediente("Huevos", 2, "unidades"),
                                new Ingrediente("Leche", 400, "ml"),
                                new Ingrediente("Azúcar", 30, "g"),
                                new Ingrediente("Mantequilla", 20, "g")
                        ),
                        List.of(
                                "Batir todos los ingredientes hasta obtener una masa fina sin grumos.",
                                "Dejar reposar la masa 10 minutos.",
                                "Cocinar en una sartén untada con mantequilla, dorando por ambos lados."
                        )
                ),
                new Receta(
                        "Zumo verde detox",
                        "Bebida depurativa y refrescante para empezar el día con energía.",
                        10, "Fácil", "Bebida", List.of("vegano", "saludable", "bajo en calorías"), "/recetas/zumo-verde-detox.jpg",
                        List.of(
                                new Ingrediente("Espinacas", 100, "g"),
                                new Ingrediente("Manzana", 1, "unidad"),
                                new Ingrediente("Pepino", 1, "unidad"),
                                new Ingrediente("Limón", 0.5, "unidad"),
                                new Ingrediente("Jengibre", 1, "al gusto")
                        ),
                        List.of(
                                "Lavar y trocear todos los ingredientes.",
                                "Licuar o batir todo junto con un poco de agua.",
                                "Colar si se prefiere una textura más ligera y servir frío."
                        )
                ),
                new Receta(
                        "Limonada casera",
                        "Refresco clásico, ideal para los días de calor.",
                        10, "Fácil", "Bebida", List.of("vegano", "rápido", "económico"), "/recetas/limonada-casera.jpg",
                        List.of(
                                new Ingrediente("Limón", 4, "unidades"),
                                new Ingrediente("Azúcar", 100, "g"),
                                new Ingrediente("Agua", 1, "litro"),
                                new Ingrediente("Hielo", 1, "al gusto")
                        ),
                        List.of(
                                "Exprimir los limones.",
                                "Mezclar el zumo con el agua y el azúcar hasta disolver.",
                                "Servir bien frío con hielo."
                        )
                ),
                new Receta(
                        "Café con leche y canela",
                        "Un clásico reconfortante para cualquier momento del día.",
                        5, "Fácil", "Bebida", List.of("vegetariano", "rápido"), "/recetas/cafe-con-leche-y-canela.jpg",
                        List.of(
                                new Ingrediente("Café", 1, "taza"),
                                new Ingrediente("Leche", 150, "ml"),
                                new Ingrediente("Canela", 1, "al gusto"),
                                new Ingrediente("Azúcar", 1, "al gusto")
                        ),
                        List.of(
                                "Preparar el café como de costumbre.",
                                "Calentar y espumar la leche.",
                                "Mezclar ambos y espolvorear con canela."
                        )
                ),
                new Receta(
                        "Sopa de miso",
                        "Sopa japonesa ligera y reconfortante, lista en minutos.",
                        15, "Fácil", "Entrante", List.of("vegano", "internacional", "bajo en calorías"), "/recetas/sopa-de-miso.jpg",
                        List.of(
                                new Ingrediente("Pasta de miso", 2, "cucharadas"),
                                new Ingrediente("Tofu", 100, "g"),
                                new Ingrediente("Alga wakame", 10, "g"),
                                new Ingrediente("Cebolleta", 1, "unidad"),
                                new Ingrediente("Caldo de verduras", 600, "ml")
                        ),
                        List.of(
                                "Calentar el caldo sin dejar que hierva con fuerza.",
                                "Disolver la pasta de miso en un poco de caldo templado.",
                                "Añadir el tofu en dados, el alga hidratada y la cebolleta picada."
                        )
                ),
                new Receta(
                        "Berenjenas rellenas",
                        "Berenjenas horneadas rellenas de tomate y queso gratinado.",
                        45, "Media", "Cena", List.of("vegetariano", "mediterráneo", "saludable"), "/recetas/berenjenas-rellenas.jpg",
                        List.of(
                                new Ingrediente("Berenjena", 2, "unidades"),
                                new Ingrediente("Tomate", 2, "unidades"),
                                new Ingrediente("Queso", 100, "g"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Aceite de oliva", 2, "cucharadas")
                        ),
                        List.of(
                                "Cortar las berenjenas por la mitad y vaciar parte de la pulpa.",
                                "Sofreír la pulpa con la cebolla y el tomate picados.",
                                "Rellenar las berenjenas con el sofrito y cubrir con queso.",
                                "Hornear a 190°C durante 25-30 minutos hasta gratinar."
                        )
                ),
                new Receta(
                        "Albóndigas en salsa",
                        "Albóndigas caseras en una salsa de tomate casera.",
                        45, "Media", "Almuerzo", List.of("proteico", "tradicional"), "/recetas/albondigas-en-salsa.jpg",
                        List.of(
                                new Ingrediente("Carne picada", 400, "g"),
                                new Ingrediente("Tomate", 4, "unidades"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Pan rallado", 50, "g"),
                                new Ingrediente("Huevos", 1, "unidad")
                        ),
                        List.of(
                                "Mezclar la carne picada con el huevo y el pan rallado, y formar bolas.",
                                "Dorar las albóndigas en una sartén con aceite.",
                                "Preparar una salsa con la cebolla y el tomate triturado.",
                                "Cocinar las albóndigas en la salsa a fuego lento durante 20 minutos."
                        )
                ),
                new Receta(
                        "Ensalada César",
                        "Ensalada clásica con pollo, queso y picatostes crujientes.",
                        20, "Fácil", "Entrante", List.of("proteico", "rápido"), "/recetas/ensalada-cesar.jpg",
                        List.of(
                                new Ingrediente("Lechuga", 1, "unidad"),
                                new Ingrediente("Pollo", 200, "g"),
                                new Ingrediente("Queso", 50, "g"),
                                new Ingrediente("Pan", 2, "rebanadas"),
                                new Ingrediente("Salsa césar", 3, "cucharadas")
                        ),
                        List.of(
                                "Cocinar el pollo a la plancha y cortarlo en tiras.",
                                "Tostar el pan y cortarlo en dados para hacer los picatostes.",
                                "Mezclar la lechuga troceada con el pollo, el queso y la salsa césar."
                        )
                ),
                new Receta(
                        "Bowl de quinoa y verduras",
                        "Bowl completo y equilibrado, ideal para el mediodía.",
                        25, "Fácil", "Almuerzo", List.of("vegano", "sin gluten", "saludable", "proteico"), "/recetas/bowl-de-quinoa-y-verduras.jpg",
                        List.of(
                                new Ingrediente("Quinoa", 200, "g"),
                                new Ingrediente("Pimiento", 1, "unidad"),
                                new Ingrediente("Aguacate", 1, "unidad"),
                                new Ingrediente("Tomate", 1, "unidad"),
                                new Ingrediente("Garbanzos", 100, "g")
                        ),
                        List.of(
                                "Cocer la quinoa según las instrucciones del paquete.",
                                "Cortar el pimiento, el aguacate y el tomate en dados.",
                                "Montar el bowl con la quinoa, las verduras y los garbanzos."
                        )
                ),
                new Receta(
                        "Salsa de tomate casera",
                        "Base imprescindible para pasta, pizzas y guisos.",
                        30, "Fácil", "Otro", List.of("vegano", "económico", "tradicional"), "/recetas/salsa-de-tomate-casera.jpg",
                        List.of(
                                new Ingrediente("Tomate", 1, "kg"),
                                new Ingrediente("Cebolla", 1, "unidad"),
                                new Ingrediente("Ajo", 2, "dientes"),
                                new Ingrediente("Aceite de oliva", 3, "cucharadas"),
                                new Ingrediente("Albahaca", 1, "al gusto")
                        ),
                        List.of(
                                "Sofreír la cebolla y el ajo picados en aceite de oliva.",
                                "Añadir el tomate triturado y cocinar a fuego lento 20 minutos.",
                                "Terminar con albahaca fresca y triturar si se desea una textura más fina."
                        )
                ),
                new Receta(
                        "Pesto casero",
                        "Salsa italiana de albahaca, ideal para pasta o tostadas.",
                        10, "Fácil", "Otro", List.of("vegetariano", "mediterráneo", "rápido"), "/recetas/pesto-casero.jpg",
                        List.of(
                                new Ingrediente("Albahaca", 50, "g"),
                                new Ingrediente("Queso", 50, "g"),
                                new Ingrediente("Piñones", 30, "g"),
                                new Ingrediente("Ajo", 1, "diente"),
                                new Ingrediente("Aceite de oliva", 100, "ml")
                        ),
                        List.of(
                                "Triturar la albahaca, el ajo y los piñones junto con el aceite.",
                                "Añadir el queso rallado y mezclar bien.",
                                "Ajustar de sal y guardar en un tarro cubierto de aceite."
                        )
                )
        );
    }
}

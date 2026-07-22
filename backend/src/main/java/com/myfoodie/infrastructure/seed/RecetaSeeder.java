package com.myfoodie.infrastructure.seed;

import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.Paso;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.PasoRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Puebla la base de datos con recetas oficiales de MyFoodie para que el feed
 * social nunca esté vacío. Solo se activa con el perfil "seed". La cuenta
 * oficial se crea una única vez (para que el email/contraseña sean estables),
 * pero sus recetas se refrescan por completo en cada ejecución para poder
 * actualizar el catálogo de RecetaSeedData sin tener que limpiar Mongo a mano.
 *
 * Uso: mvnw spring-boot:run -Dspring-boot.run.profiles=seed
 */
@Component
@Profile("seed")
@RequiredArgsConstructor
public class RecetaSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(RecetaSeeder.class);

    private static final String SEED_EMAIL = "recetas@myfoodie.app";
    private static final String SEED_NOMBRE_USUARIO = "myfoodie_oficial";
    private static final String SEED_NOMBRE = "MyFoodie";

    private final UsuarioRepository usuarioRepository;
    private final PreferenciasRepository preferenciasRepository;
    private final DespensaRepository despensaRepository;
    private final RecetaRepository recetaRepository;
    private final IngredienteRecetaRepository ingredienteRepository;
    private final PasoRepository pasoRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${myfoodie.seed.password:MyFoodieSeed2026!}")
    private String seedPassword;

    @Override
    public void run(String... args) {
        Usuario autor = usuarioRepository.findByEmail(SEED_EMAIL).orElseGet(this::crearCuentaOficial);

        List<Receta> recetasAnteriores = recetaRepository.findByAutorId(autor.getId());
        for (Receta recetaAnterior : recetasAnteriores) {
            ingredienteRepository.deleteByRecetaId(recetaAnterior.getId());
            pasoRepository.deleteByRecetaId(recetaAnterior.getId());
        }
        recetaRepository.deleteAll(recetasAnteriores);

        int recetasCreadas = 0;
        for (RecetaSeedData.Receta seed : RecetaSeedData.recetas()) {
            Receta receta = recetaRepository.save(Receta.builder()
                    .autorId(autor.getId())
                    .titulo(seed.titulo())
                    .descripcion(seed.descripcion())
                    .tiempoEstimado(seed.tiempoEstimado())
                    .dificultad(seed.dificultad())
                    .categoria(seed.categoria())
                    .etiquetas(seed.etiquetas())
                    .estado("publicada")
                    .build());

            for (RecetaSeedData.Ingrediente ingrediente : seed.ingredientes()) {
                ingredienteRepository.save(IngredienteReceta.builder()
                        .recetaId(receta.getId())
                        .nombre(ingrediente.nombre())
                        .cantidad(ingrediente.cantidad())
                        .unidad(ingrediente.unidad())
                        .build());
            }

            int orden = 1;
            for (String descripcionPaso : seed.pasos()) {
                pasoRepository.save(Paso.builder()
                        .recetaId(receta.getId())
                        .orden(orden++)
                        .descripcion(descripcionPaso)
                        .build());
            }

            recetasCreadas++;
        }

        log.info("Seed completado: {} recetas publicadas por la cuenta @{}", recetasCreadas, SEED_NOMBRE_USUARIO);
    }

    private Usuario crearCuentaOficial() {
        Usuario autor = usuarioRepository.save(Usuario.builder()
                .nombre(SEED_NOMBRE)
                .nombreUsuario(SEED_NOMBRE_USUARIO)
                .email(SEED_EMAIL)
                .passwordHash(passwordEncoder.encode(seedPassword))
                .biografia("Recetas oficiales de MyFoodie para inspirarte con lo que ya tienes en casa.")
                .build());

        preferenciasRepository.save(Preferencias.builder().usuarioId(autor.getId()).build());
        despensaRepository.save(Despensa.builder().usuarioId(autor.getId()).build());

        return autor;
    }
}

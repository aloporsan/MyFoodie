package com.myfoodie.infrastructure.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("SecurityConfig — recursos estáticos de recetas accesibles sin autenticación")
class SecurityConfigIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /recetas/{imagen} sin token devuelve la imagen (200), no 401")
    void GET_imagen_receta_sin_token_devuelve200() throws Exception {
        mockMvc.perform(get("/recetas/tortilla-de-patatas.jpg"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG));
    }

    @Test
    @DisplayName("GET /api/recetas/mis-recetas sin token sigue devolviendo 401 (el permitAll no se filtró a otras rutas)")
    void GET_misRecetas_sin_token_sigue_devolviendo401() throws Exception {
        mockMvc.perform(get("/api/recetas/mis-recetas"))
                .andExpect(status().isUnauthorized());
    }
}

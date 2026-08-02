package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoodie.domain.repository.BloqueoRepository;
import com.myfoodie.domain.repository.SeguimientoRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SocialControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private SeguimientoRepository seguimientoRepository;
    @Autowired private BloqueoRepository bloqueoRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String tokenA;
    private String idA;
    private String tokenB;
    private String idB;
    private String tokenPrivado;
    private String idPrivado;

    @BeforeEach
    void setUp() throws Exception {
        bloqueoRepository.deleteAll();
        seguimientoRepository.deleteAll();
        usuarioRepository.deleteAll();

        JsonNode a = registrar("socialusera", "socialusera@myfoodie.com");
        tokenA = a.get("token").asText();
        idA = a.get("userId").asText();

        JsonNode b = registrar("socialuserb", "socialuserb@myfoodie.com");
        tokenB = b.get("token").asText();
        idB = b.get("userId").asText();

        JsonNode privado = registrar("socialuserprivado", "socialuserprivado@myfoodie.com");
        tokenPrivado = privado.get("token").asText();
        idPrivado = privado.get("userId").asText();
        fijarPerfilPrivado(tokenPrivado);
    }

    // ===== POSITIVOS =====

    @Test
    void POST_seguir_devuelve200_perfil_publico() throws Exception {
        mockMvc.perform(post("/api/social/seguir/" + idB)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("aceptado"));
    }

    @Test
    void POST_seguir_devuelve200_estado_pendiente_perfil_privado() throws Exception {
        mockMvc.perform(post("/api/social/seguir/" + idPrivado)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("pendiente"));
    }

    @Test
    void DELETE_seguir_devuelve204() throws Exception {
        seguir(tokenA, idB);

        mockMvc.perform(delete("/api/social/seguir/" + idB)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());
    }

    @Test
    void POST_aceptar_devuelve200() throws Exception {
        seguir(tokenA, idPrivado);

        mockMvc.perform(post("/api/social/solicitudes/" + idA + "/aceptar")
                        .header("Authorization", "Bearer " + tokenPrivado))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("aceptado"));
    }

    @Test
    void POST_rechazar_devuelve200() throws Exception {
        seguir(tokenA, idPrivado);

        mockMvc.perform(post("/api/social/solicitudes/" + idA + "/rechazar")
                        .header("Authorization", "Bearer " + tokenPrivado))
                .andExpect(status().isOk());
    }

    @Test
    void GET_seguidores_devuelve200_con_array() throws Exception {
        seguir(tokenA, idB);

        mockMvc.perform(get("/api/social/seguidores")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$[0].usuarioId").value(idA))
                .andExpect(jsonPath("$[0].estado").value("aceptado"));
    }

    @Test
    void GET_seguidos_devuelve200_con_array() throws Exception {
        seguir(tokenA, idB);

        mockMvc.perform(get("/api/social/seguidos")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$[0].usuarioId").value(idB));
    }

    @Test
    void GET_solicitudes_devuelve200_con_pendientes() throws Exception {
        seguir(tokenA, idPrivado);

        mockMvc.perform(get("/api/social/solicitudes")
                        .header("Authorization", "Bearer " + tokenPrivado))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$[0].usuarioId").value(idA))
                .andExpect(jsonPath("$[0].estado").value("pendiente"));
    }

    @Test
    void GET_perfil_devuelve200_con_flags_correctos() throws Exception {
        seguir(tokenA, idB);

        mockMvc.perform(get("/api/social/perfil/" + idB)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.esSeguido").value(true))
                .andExpect(jsonPath("$.haSolicitado").value(false))
                .andExpect(jsonPath("$.estaBloqueado").value(false))
                .andExpect(jsonPath("$.privacidad").value("PUBLICA"))
                .andExpect(jsonPath("$.numSeguidores").value(1));
    }

    @Test
    void GET_buscar_devuelve200_con_resultados() throws Exception {
        mockMvc.perform(get("/api/social/buscar")
                        .param("q", "socialuserb")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$[0].nombreUsuario").value("socialuserb"));
    }

    @Test
    void POST_bloquear_devuelve200() throws Exception {
        mockMvc.perform(post("/api/social/bloquear/" + idB)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());
    }

    @Test
    void DELETE_bloquear_devuelve204() throws Exception {
        mockMvc.perform(post("/api/social/bloquear/" + idB)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/social/bloquear/" + idB)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());
    }

    @Test
    void GET_bloqueados_devuelve200_con_array() throws Exception {
        mockMvc.perform(post("/api/social/bloquear/" + idB)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/social/bloqueados")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(idB));
    }

    // ===== NEGATIVOS =====

    @Test
    void POST_seguir_devuelve400_si_se_sigue_a_si_mismo() throws Exception {
        mockMvc.perform(post("/api/social/seguir/" + idA)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());
    }

    @Test
    void POST_seguir_devuelve409_si_ya_sigue() throws Exception {
        seguir(tokenA, idB);

        mockMvc.perform(post("/api/social/seguir/" + idB)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isConflict());
    }

    @Test
    void POST_seguir_devuelve403_si_bloqueado() throws Exception {
        mockMvc.perform(post("/api/social/bloquear/" + idA)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/social/seguir/" + idB)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    void GET_perfil_devuelve403_si_bloqueado() throws Exception {
        mockMvc.perform(post("/api/social/bloquear/" + idA)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/social/perfil/" + idB)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    void POST_bloquear_devuelve400_si_se_bloquea_a_si_mismo() throws Exception {
        mockMvc.perform(post("/api/social/bloquear/" + idA)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());
    }

    @Test
    void GET_seguidores_devuelve401_sin_token() throws Exception {
        mockMvc.perform(get("/api/social/seguidores"))
                .andExpect(status().isUnauthorized());
    }

    // ===== Helpers =====

    private JsonNode registrar(String nombreUsuario, String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", nombreUsuario,
                                "nombreUsuario", nombreUsuario,
                                "email", email,
                                "password", "password123"
                        ))))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private void fijarPerfilPrivado(String token) throws Exception {
        mockMvc.perform(put("/api/perfil/privacidad")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"perfilPublico\": false}"))
                .andExpect(status().isOk());
    }

    private void seguir(String token, String usuarioId) throws Exception {
        mockMvc.perform(post("/api/social/seguir/" + usuarioId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}

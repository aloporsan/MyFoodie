package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoodie.domain.repository.NotificacionRepository;
import com.myfoodie.domain.repository.SeguimientoRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class NotificacionControllerIntegrationTest {

    @Autowired private org.springframework.test.web.servlet.MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private SeguimientoRepository seguimientoRepository;
    @Autowired private NotificacionRepository notificacionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String tokenSeguidor;
    private String tokenSeguido;
    private String notificacionId;

    @BeforeEach
    void setUp() throws Exception {
        notificacionRepository.deleteAll();
        seguimientoRepository.deleteAll();
        usuarioRepository.deleteAll();

        JsonNode seguidor = registrar("notifseguidor", "notifseguidor@myfoodie.com");
        tokenSeguidor = seguidor.get("token").asText();
        String idSeguidor = seguidor.get("userId").asText();

        JsonNode seguido = registrar("notifseguido", "notifseguido@myfoodie.com");
        tokenSeguido = seguido.get("token").asText();
        String idSeguido = seguido.get("userId").asText();

        // El perfil es público por defecto: seguir genera directamente una notificación "nuevo_seguidor".
        mockMvc.perform(post("/api/social/seguir/" + idSeguido)
                        .header("Authorization", "Bearer " + tokenSeguidor))
                .andExpect(status().isOk());

        MvcResult listado = mockMvc.perform(get("/api/notificaciones")
                        .header("Authorization", "Bearer " + tokenSeguido))
                .andReturn();
        notificacionId = objectMapper.readTree(listado.getResponse().getContentAsString()).get(0).get("id").asText();
    }

    @Test
    void GET_notificaciones_devuelve200_con_la_notificacion_de_nuevo_seguidor() throws Exception {
        mockMvc.perform(get("/api/notificaciones")
                        .header("Authorization", "Bearer " + tokenSeguido))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(notNullValue()))
                .andExpect(jsonPath("$[0].tipo").value("nuevo_seguidor"))
                .andExpect(jsonPath("$[0].emisor.nombreUsuario").value("notifseguidor"))
                .andExpect(jsonPath("$[0].titulo").value("notifseguidor te ha seguido"))
                .andExpect(jsonPath("$[0].leida").value(false));
    }

    @Test
    void GET_contador_devuelve200_con_una_no_leida() throws Exception {
        mockMvc.perform(get("/api/notificaciones/contador")
                        .header("Authorization", "Bearer " + tokenSeguido))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.noLeidas").value(1));
    }

    @Test
    void PUT_leer_marca_la_notificacion_como_leida_y_baja_el_contador() throws Exception {
        mockMvc.perform(put("/api/notificaciones/" + notificacionId + "/leer")
                        .header("Authorization", "Bearer " + tokenSeguido))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notificaciones/contador")
                        .header("Authorization", "Bearer " + tokenSeguido))
                .andExpect(jsonPath("$.noLeidas").value(0));
    }

    @Test
    void PUT_leer_falla_si_la_notificacion_no_es_del_usuario_autenticado() throws Exception {
        mockMvc.perform(put("/api/notificaciones/" + notificacionId + "/leer")
                        .header("Authorization", "Bearer " + tokenSeguidor))
                .andExpect(status().isForbidden());
    }

    @Test
    void PUT_leer_todas_marca_todas_como_leidas() throws Exception {
        mockMvc.perform(put("/api/notificaciones/leer-todas")
                        .header("Authorization", "Bearer " + tokenSeguido))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notificaciones/contador")
                        .header("Authorization", "Bearer " + tokenSeguido))
                .andExpect(jsonPath("$.noLeidas").value(0));
    }

    @Test
    void DELETE_notificacion_devuelve204_y_la_elimina() throws Exception {
        mockMvc.perform(delete("/api/notificaciones/" + notificacionId)
                        .header("Authorization", "Bearer " + tokenSeguido))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/notificaciones")
                        .header("Authorization", "Bearer " + tokenSeguido))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void DELETE_notificacion_falla_si_no_es_del_usuario_autenticado() throws Exception {
        mockMvc.perform(delete("/api/notificaciones/" + notificacionId)
                        .header("Authorization", "Bearer " + tokenSeguidor))
                .andExpect(status().isForbidden());
    }

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
}

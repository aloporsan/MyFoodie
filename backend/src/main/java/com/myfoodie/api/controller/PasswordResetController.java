package com.myfoodie.api.controller;

import com.myfoodie.application.dto.auth.ForgotPasswordRequestDTO;
import com.myfoodie.application.dto.auth.ResetPasswordRequestDTO;
import com.myfoodie.application.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDTO request) {
        passwordResetService.forgotPassword(request.email());
        return ResponseEntity.ok(Map.of("message", "Si el email existe, recibirás un enlace en breve"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDTO request) {
        passwordResetService.resetPassword(request.token(), request.nuevaPassword());
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente"));
    }
}

package com.myfoodie.exception;

import com.myfoodie.application.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<ApiErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex, HttpServletRequest request) {
		ApiErrorResponse body = ApiErrorResponse.of(
				HttpStatus.BAD_REQUEST.value(),
				"Bad Request",
				"La imagen no puede superar los 10MB",
				request.getRequestURI()
		);
		return ResponseEntity.badRequest().body(body);
	}

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
		ApiErrorResponse body = ApiErrorResponse.of(
				ex.getStatus().value(),
				ex.getStatus().getReasonPhrase(),
				ex.getMessage(),
				request.getRequestURI()
		);
		return ResponseEntity.status(ex.getStatus()).body(body);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
		String message = ex.getBindingResult().getFieldErrors().stream()
				.map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
				.findFirst()
				.orElse("Validation error");

		ApiErrorResponse body = ApiErrorResponse.of(
				HttpStatus.BAD_REQUEST.value(),
				"Bad Request",
				message,
				request.getRequestURI()
		);
		return ResponseEntity.badRequest().body(body);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
		ApiErrorResponse body = ApiErrorResponse.of(
				HttpStatus.INTERNAL_SERVER_ERROR.value(),
				"Internal Server Error",
				ex.getMessage(),
				request.getRequestURI()
		);
		return ResponseEntity.internalServerError().body(body);
	}

}

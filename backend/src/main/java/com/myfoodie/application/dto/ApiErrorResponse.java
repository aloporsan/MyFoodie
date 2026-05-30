package com.myfoodie.application.dto;

import java.time.Instant;

public record ApiErrorResponse(
		int status,
		String error,
		String message,
		String path,
		Instant timestamp
) {
	public static ApiErrorResponse of(int status, String error, String message, String path) {
		return new ApiErrorResponse(status, error, message, path, Instant.now());
	}
}

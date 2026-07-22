import axios from "axios";
import Constants from "expo-constants";

const getApiBaseUrl = (): string => {
	const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
	if (configuredUrl) {
		return configuredUrl;
	}

	const hostUri = Constants.expoConfig?.hostUri;
	if (hostUri) {
		const host = hostUri.split(":")[0];
		if (host && host !== "localhost" && host !== "127.0.0.1") {
			return `http://${host}:8080/api`;
		}
	}

	return "http://localhost:8080/api";
};

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
});

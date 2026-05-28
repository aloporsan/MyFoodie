import React, { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { api } from "@/services/api";

export default function HomeScreen() {
	const [message, setMessage] = useState("Sin conectar con el backend");

	const checkBackend = async () => {
		try {
			const response = await api.get("/health");
			setMessage(response.data.message);
		} catch (error) {
			setMessage("Error conectando con el backend");
			console.error(error);
		}
	};

	useEffect(() => {
		checkBackend();
	}, []);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>MYFOOD</Text>
			<Text style={styles.subtitle}>React Native + Spring Boot</Text>
			<Text style={styles.message}>{message}</Text>
			<Button title="Comprobar backend" onPress={checkBackend} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	title: {
		fontSize: 32,
		fontWeight: "bold",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		marginBottom: 20,
	},
	message: {
		fontSize: 16,
		marginBottom: 20,
		textAlign: "center",
	},
});
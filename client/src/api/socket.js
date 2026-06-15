import { io } from "socket.io-client";

const getToken = () => {
	try {
		const user = JSON.parse(localStorage.getItem("user"));
		return user?.token;
	} catch {
		return null;
	}
};

const socket = io("http://localhost:5000", {
	auth: {
		token: getToken(),
	},
	autoConnect: true,
});

// Reconnect with fresh token if it changes (simple approach)
window.addEventListener("storage", (e) => {
	if (e.key === "user") {
		const token = getToken();
		socket.auth = { token };
		if (!socket.connected) socket.connect();
	}
});

export default socket;

import { defineConfig } from "vite";

export default defineConfig({
	css: {
		transformer: "lightningcss",
	},
	build: {
		target: "esnext",
	},
});

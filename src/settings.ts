export class Settings {
	theme: "light" | "dark";
	font: "serif" | "sans-serif" | "monospace";
	themeToggle: HTMLButtonElement;

	constructor({ themeToggle }: { themeToggle: HTMLButtonElement }) {
		this.themeToggle = themeToggle;

		const initialTheme = window.matchMedia("(prefers-color-scheme: dark)")
			.matches
			? "dark"
			: "light";

		console.log(initialTheme);

		this.theme =
			(localStorage.getItem("theme") as "light" | "dark") ?? initialTheme;

		this.font =
			(localStorage.getItem("font") as "serif" | "sans-serif" | "monospace") ??
			"serif";

		this.apply();
	}

	save = () => {
		localStorage.setItem("theme", this.theme);
		localStorage.setItem("font", this.font);
	};

	toggleTheme = () => {
		this.theme = this.theme === "light" ? "dark" : "light";
		this.save();
		this.apply();
	};

	toggleFont = () => {
		if (this.font === "serif") {
			this.font = "sans-serif";
		} else if (this.font === "sans-serif") {
			this.font = "monospace";
		} else {
			this.font = "serif";
		}
		this.save();
		this.apply();
	};

	apply = () => {
		document.documentElement.setAttribute("data-theme", this.theme);

		if (this.theme === "dark") {
			this.themeToggle.classList.add("theme-toggle--toggled");
		} else {
			this.themeToggle.classList.remove("theme-toggle--toggled");
		}

		document.body.style.fontFamily = `var(--font-${this.font})`;
	};
}

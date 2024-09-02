/** @type {HTMLTextAreaElement} */
const editor = document.getElementById("editor");

/** @type {HTMLBodyElement} */
const body = document.querySelector("body");

/** @type {HTMLButtonElement} */
const themeToggle = document.querySelector(".theme-toggle");

/** @type {HTMLButtonElement} */
const fontToggle = document.getElementById("font-family");

/** @type {HTMLSpanElement} */
const wordcount = document.querySelector("#word-count span");

const updateWordCount = (text = "") => {
	if (!text || text.trim() === "") {
		wordcount.textContent = "0";
		return;
	}
	const words = text.trim().split(/\s+/).length;
	wordcount.textContent = words;
};

editor.focus();

// Dark mode
const dark = localStorage.getItem("dark");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (dark === "true" || (prefersDark && dark !== "false")) {
	document.documentElement.setAttribute("data-theme", "dark");
	themeToggle.classList.add("theme-toggle--toggled");
}

// Font family
let font = localStorage.getItem("font") ?? "serif";
body.style.fontFamily = `var(--font-${font})`;

// Font toggle
fontToggle.addEventListener("click", () => {
	if (font.includes("sans-serif")) {
		font = "monospace";
	} else if (font.includes("serif")) {
		font = "sans-serif";
	} else {
		font = "serif";
	}
	body.style.fontFamily = `var(--font-${font})`;
	localStorage.setItem("font", font);
});

// Theme toggle
themeToggle.addEventListener("click", () => {
	const isDark = document.documentElement.getAttribute("data-theme") === "dark";
	document.documentElement.setAttribute(
		"data-theme",
		isDark ? "light" : "dark",
	);
	localStorage.setItem("dark", isDark ? "false" : "true");
	themeToggle.classList.toggle("theme-toggle--toggled");
});

/**
 * @param {Function} func
 * @param {number} delay
 */
const debounce = (func, delay = 800) => {
	let timeoutId;
	return (...args) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
};

/**
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function isSelectionAtEnd(el) {
	return el.selectionStart === el.value.length;
}

const resize = () => {
	editor.style.height = "auto";
	editor.style.height = `${editor.scrollHeight}px`;
};

// Save text
editor.addEventListener("input", (event) => {
	// fix height
	resize();
	const text = editor.value;
	updateWordCount(text);
	debounce(() => {
		localStorage.setItem("text", text);
	})();

	if (isSelectionAtEnd(editor)) {
		window.scrollTo(0, document.body.scrollHeight);
	}

	if (event.inputType === "insertLineBreak") {
		const lines = text.split("\n");
		const lastLine = lines[lines.length - 2];

		const prefixMatch = lastLine.match(/^(\d+\. |(?:>|\*|-) )/);
		if (prefixMatch) {
			const fullPrefix = prefixMatch[0];
			const trimmedLastLine = lastLine.trim();

			if (trimmedLastLine === fullPrefix.trim()) {
				editor.value = `${text.substring(0, text.length - fullPrefix.length - 1)}\n`;
			} else {
				let newPrefix = fullPrefix;
				const match = Number.parseInt(prefixMatch[1]);
				if (!Number.isNaN(match)) {
					newPrefix = `${match + 1}. `;
				}
				editor.value += newPrefix;
			}

			event.preventDefault();
		}
	}
});

// paste as plain text
editor.addEventListener("paste", (event) => {
	event.preventDefault();
	const text = (event.clipboardData || window.clipboardData).getData(
		"text/plain",
	);
	editor.setRangeText(text, editor.selectionStart, editor.selectionEnd, "end");
	resize();
});

// click on body
body.addEventListener("click", (event) => {
	if (event.target === document.body) {
		editor.focus();
	}
});

// Load saved text
const savedText = localStorage.getItem("text");
if (savedText) {
	editor.value = savedText;
	updateWordCount(savedText);
}
resize();

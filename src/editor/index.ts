import { debounce } from "../utils";
import { smartQuotes } from "./features";
import { EditorHistory } from "./history";
import { createNanoEvents, type Emitter } from "nanoevents";

interface Events {
	save: (text: string) => void;
	wordCountChange: (count: number) => void;
}

export class Editor {
	#events: Emitter<Events>;
	#history: EditorHistory;
	#editor: HTMLInputElement;
	#historyInterval: number | null = null;
	#historyTimeout: Timer | null = null;

	constructor({ editor }: { editor: HTMLInputElement }) {
		this.#events = createNanoEvents();

		this.#editor = editor;
		this.#editor.addEventListener("beforeinput", this.#handleBeforeInput);
		this.#editor.addEventListener("paste", this.#handlePaste);
		this.#editor.addEventListener("input", this.#handleInput as EventListener);
		this.#editor.addEventListener("keydown", this.#handleKeydown);
		window.addEventListener("beforeunload", this.#handleSave);

		this.#history = new EditorHistory(this.#editor.value);

		setInterval(() => {
			this.#pushHistory();
		}, 2000);
	}

	unload = () => {
		this.#editor.removeEventListener("beforeinput", this.#handleBeforeInput);
		this.#editor.removeEventListener("paste", this.#handlePaste);
		this.#editor.removeEventListener("input", this.#handleInput as EventListener);
		this.#editor.removeEventListener("keydown", this.#handleKeydown);
		window.removeEventListener("beforeunload", this.#handleSave);

		if (this.#historyTimeout) clearTimeout(this.#historyTimeout);
		if (this.#historyInterval) clearInterval(this.#historyInterval);
		this.#historyInterval = null;
		this.#historyTimeout = null;
	};

	on<E extends keyof Events>(event: E, callback: Events[E]) {
		return this.#events.on(event, callback);
	}

	focus = () => this.#editor.focus();

	loadText = (text: string) => {
		if (this.#historyTimeout) clearTimeout(this.#historyTimeout);
		if (this.#historyInterval) clearInterval(this.#historyInterval);
		this.#editor.value = text;
		this.#history = new EditorHistory(this.#editor.value);
		this.#resize();
		this.focus();
	};

	#handleSave = () => {
		this.#events.emit("save", this.#editor.value);
	};

	#pushHistory = () => this.#history.push(this.#editor.value);

	#handleKeydown = (event: KeyboardEvent) => {
		if (event.key === "Tab") {
			event.preventDefault();
			this.#pushHistory();
			this.#editor.setRangeText("  ", this.#editor.selectionStart ?? 0, this.#editor.selectionEnd ?? 0, "end");
		}

		if (event.key === "z" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			if (event.shiftKey) {
				this.#editor.value = this.#history.redo();
			} else {
				this.#editor.value = this.#history.undo();
			}
			this.#resize();
		}
		if (event.key === "y" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			this.#editor.value = this.#history.redo();
			this.#resize();
		}
	};

	#resize = () => {
		this.#editor.style.height = "auto";
		this.#editor.style.height = `${this.#editor.scrollHeight}px`;
	};

	#handlePaste = (event: ClipboardEvent) => {
		event.preventDefault();
		const text = event.clipboardData?.getData("text/plain") ?? "";
		this.#editor.setRangeText(text, this.#editor.selectionStart ?? 0, this.#editor.selectionEnd ?? 0, "end");
		this.#resize();
	};

	#handleBeforeInput = (event: InputEvent) => {
		const selectionStart = this.#editor.selectionStart ?? 0;
		const selectionEnd = this.#editor.selectionEnd ?? 0;

		if (selectionEnd - selectionStart > 0) {
			if (["*", "_", "~", '"'].includes(event.data ?? "")) {
				event.preventDefault();
				this.#pushHistory();

				let prefix = event.data;
				let suffix = event.data;

				if (event.data === '"') {
					prefix = "“";
					suffix = "”";
				}

				this.#editor.setRangeText(
					prefix + this.#editor.value.substring(selectionStart, selectionEnd) + suffix,
					selectionStart,
					selectionEnd,
					"end",
				);

				// select the text inside the formatting
				this.#editor.setSelectionRange(selectionStart + 1, selectionEnd + 1);
			}
		}
	};

	#saveDebounced = debounce(() => {
		this.#events.emit("save", this.#editor.value);
	});

	#handleInput = (event: InputEvent) => {
		this.#resize();
		const text = this.#editor.value;

		if (text.length === 0 || text.trim().length === 0) this.#events.emit("wordCountChange", 0);
		this.#events.emit("wordCountChange", text.trim().split(/\s+/).length);

		this.#saveDebounced();

		if (this.#editor.selectionStart === this.#editor.value.length) {
			window.scrollTo(0, document.body.scrollHeight);
		}

		if (event.inputType === "deleteContentBackward") {
			this.#historyTimeout = setTimeout(this.#pushHistory, 200);
		}

		if (event.inputType === "insertText") {
			const position = this.#editor.selectionStart ?? 0;
			const text = this.#editor.value;

			if (this.#historyTimeout) clearTimeout(this.#historyTimeout);
			if (text === " ") {
				this.#historyTimeout = setTimeout(this.#pushHistory, 200);
			} else {
				this.#historyTimeout = setTimeout(this.#pushHistory, 500);
			}

			// ellipsis
			if (event.data === ".") {
				if (text[position - 2] === "." && text[position - 3] === ".") {
					this.#editor.setRangeText("…", position - 3, position, "end");
				}
			}

			// em dash
			if (event.data === "-" && text[position - 2] === "-") {
				this.#editor.setRangeText("—", position - 2, position, "end");
			}

			// << and >>
			if (event.data === ">" && text[position - 2] === ">") {
				this.#editor.setRangeText("»", position - 2, position, "end");
			}

			if (event.data === "<" && text[position - 2] === "<") {
				this.#editor.setRangeText("«", position - 2, position, "end");
			}

			// smart quotes
			smartQuotes(event.data, position, this.#editor);
		}

		if (event.inputType === "insertLineBreak") {
			const lines = text.split("\n");
			const lastLine = lines[lines.length - 2];

			const prefixMatch = lastLine.match(/^(\d+\. |(?:>|\*|-) )/);
			if (prefixMatch) {
				const fullPrefix = prefixMatch[0];
				const trimmedLastLine = lastLine.trim();

				if (trimmedLastLine === fullPrefix.trim()) {
					this.#editor.value = `${text.substring(0, text.length - fullPrefix.length - 1)}\n`;
				} else {
					let newPrefix = fullPrefix;
					const match = Number.parseInt(prefixMatch[1]);
					if (!Number.isNaN(match)) {
						newPrefix = `${match + 1}. `;
					}
					this.#editor.value += newPrefix;
				}

				event.preventDefault();
			}

			this.#pushHistory();
		}
	};
}

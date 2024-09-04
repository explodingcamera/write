export class EditorHistory {
	states: string[] = [];
	currentIndex = -1;

	constructor(initialState: string) {
		this.push(initialState);
	}

	push(state: string) {
		if (this.states[this.currentIndex] === state) {
			return;
		}

		this.states = this.states.slice(0, this.currentIndex + 1);
		this.states.push(state);
		this.currentIndex++;
	}
	undo() {
		if (this.currentIndex > 0) {
			this.currentIndex--;
			return this.states[this.currentIndex];
		}
		return this.states[0];
	}
	redo() {
		if (this.currentIndex < this.states.length - 1) {
			this.currentIndex++;
			return this.states[this.currentIndex];
		}
		return this.states[this.states.length - 1];
	}
}

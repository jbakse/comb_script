////////////////////////////////////////////////////////////////////
// File
//
// Represents a CombScript file.
// Using ES6
//
// Published Topics:
// File/opened
// File/changed
// File/closed

class File {

	constructor(_title, _content) {
		this.title = _title || "untitled";
		this.content = _content || "";
		this._savedContent = _content;
		this.isOpen = false;
		this.isDirty = false;
	}

	open() {
		this.isOpen = true;
		$.Topic("File/opened").publish(this);
	}

	close(_force) {
		let shouldClose = true;
		if (this.isDirty && !_force) {
			shouldClose = window.confirm("The current file has unsaved changes. Do you want to discard these changes?");
		}
		if (shouldClose) {
			this.isOpen = false;
			$.Topic("File/closed").publish(this);
		}
		return shouldClose;
	}

	markSaved() {
		this._savedContent = this.content;
		this.isDirty = false;
		$.Topic("File/changed").publish(this);
	}

	setContent(_content) {
		if (this.content === _content) return;

		this.content = _content;
		this.isDirty = (this.content !== this._savedContent);
		$.Topic("File/changed").publish(this);
	}


	toString() {
		return `File: ${this.title}`;
	}
}

module.exports = File;


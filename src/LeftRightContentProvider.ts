import * as vscode from 'vscode';

export default class LeftRightContentProvider implements vscode.TextDocumentContentProvider {
	constructor(
		private readonly _dictionary: { [key: string]: string; }
	) {
	}

	provideTextDocumentContent(uri: vscode.Uri): string {
		return this._dictionary[uri.path];
	}
}

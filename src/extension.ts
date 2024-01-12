import * as vscode from 'vscode';
import { DiffComparePanelProvider } from './DiffComparePanelProvider';
import { EXTENSION_SCHEME } from './const';
import LeftRightContentProvider from './LeftRightContentProvider';

export function activate(context: vscode.ExtensionContext) {
	let dictonary: { [key: string]: string } = {}

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(EXTENSION_SCHEME, new LeftRightContentProvider(dictonary)));

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(DiffComparePanelProvider.viewType, new DiffComparePanelProvider(context.extensionUri, dictonary)));
}

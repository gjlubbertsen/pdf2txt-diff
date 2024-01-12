import * as vscode from 'vscode';
import { pdfToText } from './pdfts';
import { EXTENSION_SCHEME } from './const';

export class DiffComparePanelProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'pdf2text.PanelView';

	private _view?: vscode.WebviewView;
	private _leftUri?: vscode.Uri;
	private _rightUri?: vscode.Uri;
	
	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _dictionary: { [key: string]: string }
	) { }

	private async ReadFileContent(fileUri: vscode.Uri) 
	{
		const pdf = await vscode.workspace.fs.readFile(fileUri);
    	return await pdfToText(pdf);
	}

	private getFileName = (uri: vscode.Uri) : string => (uri.fsPath.split('\\').pop() ?? '');

	public async SetLeftFile(fileUri: vscode.Uri) 
	{
		this._leftUri = fileUri;
    	this._dictionary['left'] = await this.ReadFileContent(this._leftUri);
		if (this._leftUri && this._rightUri) {
			this.RenderDiff();
		}
	}

	public async SetRightFile(fileUri: vscode.Uri) 
	{
		this._rightUri = fileUri;
    	this._dictionary['right'] = await this.ReadFileContent(this._rightUri);
		if (this._leftUri && this._rightUri) {
			this.RenderDiff();
		}
	}

	private RenderDiff() {
		if (this._leftUri && this._rightUri) {

			const now = new Date();
			const getUri = (textKey: string) => vscode.Uri.parse(`${EXTENSION_SCHEME}:${textKey}?_timestamp=${now.getTime()}`)
			const title = `${this.getFileName(this._leftUri)}  ↔  ${this.getFileName(this._rightUri)}`;
			return vscode.commands.executeCommand('vscode.diff', getUri('left'), getUri('right'), title);
		}
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.command) {
				case 'selectLeft':
					{
						vscode.window.showOpenDialog({
							canSelectFolders: false,
							canSelectMany: false,
							openLabel: 'Select',
							defaultUri:  vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : undefined,
							title: 'Select Left PDF File',
							filters: {
								'PDF Files': ['pdf'],
							}
						}).then(async fileUri => {
							if (fileUri) {
								this._view?.webview.postMessage({
									type: 'leftSelected',
									value: this.getFileName(fileUri[0])
								});
								await this.SetLeftFile(fileUri[0]);
							}
						});
						break;
					}
				case 'selectRight':
					{
						vscode.window.showOpenDialog({
							canSelectFolders: false,
							canSelectMany: false,
							defaultUri:  vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : undefined,
							openLabel: 'Select',
							title: 'Select Right PDF File',
							filters: {
								'PDF Files': ['pdf'],
							}
						}).then(async fileUri => {
							if (fileUri) {
								
								this._view?.webview.postMessage({
									type: 'rightSelected',
									value: this.getFileName(fileUri[0])
								});
								await this.SetRightFile(fileUri[0]);
							}
						});
						break;
					}
			}
		});
	}


	private _getHtmlForWebview(webview: vscode.Webview) {
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');

		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

		// Local path to css styles
		const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
		const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css');

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = this.getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>Cat Coding</title>
			</head>
			<body>
				<button id="selectLeft">Select Left</button>
				<div id="leftSelectedFileName">-</div>
				<button id="selectRight">Select Right</button>
				<div id="rightSelectedFileName">-</div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private getNonce() {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}

}

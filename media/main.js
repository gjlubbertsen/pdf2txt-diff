// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    document.getElementById('selectLeft').onclick = function () {
        vscode.postMessage({
            command: 'selectLeft'
        });
    };

    document.getElementById('selectRight').onclick = function () {
        vscode.postMessage({
            command: 'selectRight'
        });
    };


    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        debugger;
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'leftSelected':
                document.getElementById('selectLeft').style.backgroundColor = 'green';
                document.getElementById('leftSelectedFileName').innerHTML = message.value;
                break;
            case 'rightSelected':
                document.getElementById('selectRight').style.backgroundColor = 'green';
                document.getElementById('rightSelectedFileName').innerHTML = message.value;
                break;
        }
    });
}());

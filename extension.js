const vscode = require('vscode');

function activate(context) {
    console.log('HUML ext activated');
}

function deactivate() {
    console.log('HUML ext deactivated');
}

module.exports = {
    activate,
    deactivate
};

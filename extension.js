const vscode = require("vscode");
const HumlFoldingProvider = require("./src/foldingProvider");

function activate(context) {
  console.log("HUML ext activated");

  // Register the folding provider
  const foldingProvider = vscode.languages.registerFoldingRangeProvider(
    { language: "huml" },
    new HumlFoldingProvider()
  );

  context.subscriptions.push(foldingProvider);
}

function deactivate() {
  console.log("HUML ext deactivated");
}

module.exports = {
  activate,
  deactivate,
};

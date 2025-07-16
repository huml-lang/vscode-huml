const vscode = require("vscode");

/**
 * Custom folding provider for HUML files
 */
class HumlFoldingProvider {
  provideFoldingRanges(document, context, token) {
    const foldingRanges = [];
    const lines = document.getText().split("\n");

    // Stack to track nested structures
    const stack = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      const indentLevel = this.getIndentLevel(line);

      // Close any open ranges that are at the same or deeper level
      while (
        stack.length > 0 &&
        stack[stack.length - 1].indent >= indentLevel
      ) {
        const range = stack.pop();
        if (i - 1 > range.start) {
          foldingRanges.push(
            new vscode.FoldingRange(range.start, i - 1, range.kind)
          );
        }
      }

      // Check for vector keys (key::)
      if (this.isVectorKey(trimmedLine)) {
        stack.push({
          start: i,
          indent: indentLevel,
          kind: vscode.FoldingRangeKind.Region,
        });
      }

      // Check for list items with potential nested content
      else if (this.isListItem(trimmedLine)) {
        // Look ahead to see if there's nested content
        if (this.hasNestedContent(lines, i)) {
          stack.push({
            start: i,
            indent: indentLevel,
            kind: vscode.FoldingRangeKind.Region,
          });
        }
      }

      // Check for multiline strings
      else if (this.isMultilineStringStart(trimmedLine)) {
        const endLine = this.findMultilineStringEnd(lines, i, trimmedLine);
        if (endLine > i) {
          foldingRanges.push(
            new vscode.FoldingRange(i, endLine, vscode.FoldingRangeKind.Region)
          );
        }
      }
    }

    // Close any remaining open ranges
    while (stack.length > 0) {
      const range = stack.pop();
      if (lines.length - 1 > range.start) {
        foldingRanges.push(
          new vscode.FoldingRange(range.start, lines.length - 1, range.kind)
        );
      }
    }

    return foldingRanges;
  }

  getIndentLevel(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  isVectorKey(line) {
    return /^.*::\s*(#.*)?$/.test(line);
  }

  isListItem(line) {
    return /^-\s+/.test(line);
  }

  hasNestedContent(lines, startIndex) {
    if (startIndex >= lines.length - 1) return false;

    const currentIndent = this.getIndentLevel(lines[startIndex]);

    // Check next few lines for deeper indentation
    for (
      let i = startIndex + 1;
      i < Math.min(startIndex + 5, lines.length);
      i++
    ) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      const indent = this.getIndentLevel(lines[i]);
      if (indent > currentIndent) {
        return true;
      }
      if (indent <= currentIndent) {
        break;
      }
    }

    return false;
  }

  isMultilineStringStart(line) {
    return line.includes('"""') || line.includes("```");
  }

  findMultilineStringEnd(lines, startIndex, startLine) {
    let delimiter = "";
    if (startLine.includes('"""')) {
      delimiter = '"""';
    } else if (startLine.includes("```")) {
      delimiter = "```";
    }

    if (!delimiter) return startIndex;

    // If the delimiter appears twice on the same line, it's a single-line string
    const occurrences = (startLine.match(new RegExp(delimiter, "g")) || [])
      .length;
    if (occurrences >= 2) {
      return startIndex;
    }

    // Look for the closing delimiter
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (lines[i].includes(delimiter)) {
        return i;
      }
    }

    return startIndex;
  }
}

module.exports = HumlFoldingProvider;

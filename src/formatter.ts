import * as vscode from 'vscode';

function getExpectedIndent(lineText: string, style: 'spaces' | 'tabs', size: number): string {
    const currentIndentLevel = calculateIndentLevel(lineText);

    if (style === 'spaces') {
        return ' '.repeat(currentIndentLevel * size);
    } else {
        return '\t'.repeat(currentIndentLevel);
    }
}

function addMissingSemicolon(lineText: string): string {
    if (
        lineText.trim().endsWith(';') ||
        lineText.trim().endsWith('{') ||
        lineText.trim().endsWith('}') ||
        lineText.trim().endsWith(',') ||
         lineText.trim().includes(':') ||
        lineText.trim() === ''
    ) {
        return lineText;
    }


    if (lineText.trim().startsWith('//') || lineText.trim().startsWith('/*')) {
        return lineText;
    }

    // TODO: Investigate this properly
    // Check if the line should have a semicolon (heuristic-based)
    // const shouldEndWithSemicolon = /[a-zA-Z0-9)\]"]$/.test(lineText.trim());
    // const shouldEndWithSemicolon = /[\w)\]"]$/.test(lineText.trim());
    const shouldEndWithSemicolon = true;

    if (shouldEndWithSemicolon) {
        // console.log("should end with semicolon", shouldEndWithSemicolon, lineText.trimEnd());
        return `${lineText.trimEnd()};`;
    }

    return lineText;
}

function calculateIndentLevel(lineText: string): number {
    // Basic heuristic: adjust based on the line's position, content, or code structure
    if (lineText.trim().endsWith('{')) {
        return 1; // Indent by one level for blocks
    }
    if (lineText.trim().startsWith('}')) {
        return -1; // Dedent for closing braces
    }
    return 0; // No change for other lines
}

export function formatDocument(document: vscode.TextDocument): vscode.TextEdit[] {
    let edits: vscode.TextEdit[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i];

        // ^ Rule 1: 3 lines after import statements
        if (currentLine.trim().startsWith('import') && !lines[i+1].trim().startsWith('import')) {

            // TODO: Make it configurable later so that users specify the lines they want after imports

            if(lines[i + 1]?.trim() !== '' && !lines[i+1].startsWith('import') && !lines[i+2].trim().startsWith('import') && !lines[i+3].trim().startsWith('import')){
                edits.push(vscode.TextEdit.insert(new vscode.Position(i + 1, 0), '\n\n\n'));
            }

            if(lines[i + 2]?.trim() !== '' && !lines[i+2].trim().startsWith('import') && !lines[i+3].trim().startsWith('import')){
                edits.push(vscode.TextEdit.insert(new vscode.Position(i + 2, 0), '\n\n'));
            }

            if(lines[i + 3]?.trim() !== '' && !lines[i+3].trim().startsWith('import')){
                edits.push(vscode.TextEdit.insert(new vscode.Position(i + 3, 0), '\n'));
            }
         }

        //  ^ Rule 2: All imports must end with semicolons
        if(currentLine.startsWith('import') && !currentLine.endsWith(';')){
        
            const addedSemiColonToLine =  `${currentLine.trimEnd()};`;

            const line = document.lineAt(i);

            edits.push(vscode.TextEdit.replace(line.range, addedSemiColonToLine));
        }

        // ^ Rule 3: 3 lines before return in .tsx files
        if (document.fileName.endsWith('.tsx') && currentLine.trim().startsWith('return')) {
       
            if (lines[i - 1]?.trim() !== '') {
                edits.push(vscode.TextEdit.insert(new vscode.Position(i, 0), '\n\n\n'));
            }

            if (lines[i - 2]?.trim() !== '') {
                edits.push(vscode.TextEdit.insert(new vscode.Position(i, 0), '\n\n'));
            }
            if (lines[i - 3]?.trim() !== '') {
                edits.push(vscode.TextEdit.insert(new vscode.Position(i, 0), '\n'));
            }
        }

        // ^ Rule 4: 1 line before return in .ts files
        if (document.fileName.endsWith('.ts') && currentLine.trim().startsWith('return')) {
           
            // add new empty line above return if the previous line is not empty
            if (lines[i - 1]?.trim() !== '') {
                edits.push(vscode.TextEdit.insert(new vscode.Position(i, 0), '\n'));
            }


            // delete all empty lines above first empty line above return statement
            for(let j=i-2; j>= 0; j--){
                if (lines[j]?.trim() === '') {
                   const line = document.lineAt(j);
                   const rangeToDelete = new vscode.Range(
                        line.range.start,
                        new vscode.Position(line.lineNumber + 1, 0)
                    );
                    edits.push(vscode.TextEdit.replace(rangeToDelete, ''));

                 } else {
                    // Stop deleting once a non-empty line is found
                    break;
                }
            }
        }

        //^  Rule 5: 2 lines between functions in .ts files
        if (
            document.fileName.endsWith('.ts') &&
            !document.fileName.endsWith('.tsx') &&
            currentLine.trim().endsWith('}')
            
        ) {
            if((lines[i + 1]?.trim().startsWith('function') || lines[i + 1]?.trim().includes('=>'))){
                edits.push(vscode.TextEdit.insert(new vscode.Position(i + 1, 0), '\n\n'));
            }

            if((lines[i + 2]?.trim().startsWith('function') || lines[i + 2]?.trim().includes('=>'))){
                edits.push(vscode.TextEdit.insert(new vscode.Position(i + 1, 0), '\n'));
            }

            // delete extra empty lines
            for(let j=i+3; j<= lines.length; j++){
                if (lines[j]?.trim() === '') {
                const line = document.lineAt(j);
                const rangeToDelete = new vscode.Range(
                    line.range.start,
                    new vscode.Position(line.lineNumber + 1, 0)
                );
                edits.push(vscode.TextEdit.replace(rangeToDelete, ''));

                } else {  break; }
            }
        }

        // ^ Rule 6: 1 line between functions in .tsx files
        if (
            document.fileName.endsWith('.tsx') &&
            currentLine.trim().endsWith('}') &&
            lines[i + 1]?.trim().startsWith('function')
        ) {
             if((lines[i + 1]?.trim().startsWith('function') || lines[i + 1]?.trim().includes('=>'))){
                edits.push(vscode.TextEdit.insert(new vscode.Position(i + 1, 0), '\n\n'));
            }

            if((lines[i + 2]?.trim().startsWith('function') || lines[i + 2]?.trim().includes('=>'))){
                edits.push(vscode.TextEdit.insert(new vscode.Position(i + 1, 0), '\n'));
            }

            // delete extra empty lines
            for(let j=i+3; j<= lines.length; j++){
                if (lines[j]?.trim() === '') {
                const line = document.lineAt(j);
                const rangeToDelete = new vscode.Range(
                    line.range.start,
                    new vscode.Position(line.lineNumber + 1, 0)
                );
                edits.push(vscode.TextEdit.replace(rangeToDelete, ''));

                } 
                else {  
                    break; 
                }
            }
        }

        //^ Rule 7: 1 line between return and whatever comes next
        if (currentLine.trim().startsWith('return')) {
            // add new empty line above return if the previous line is not empty
            if (lines[i + 1]?.trim() !== '') {
                edits.push(vscode.TextEdit.insert(new vscode.Position(i+1, 0), '\n'));
            }
         }

        // ^ Rule 8: Delete all empty lines above first empty line above } statement
        if ( currentLine.trim().endsWith('}')) {
         
            for(let j = i-2; j>= 0; j--){
                if (lines[j]?.trim() === '') {
                    const line = document.lineAt(j);
                    const rangeToDelete = new vscode.Range(
                        line.range.start,
                        new vscode.Position(line.lineNumber + 1, 0)
                    );
                    edits.push(vscode.TextEdit.replace(rangeToDelete, ''));

                    } else {
                    // Stop deleting once a non-empty line is found
                    break;
                }
            }
        }

        // ^ Rule 9: Adds Semicolons to lines that expect semi colons
        const line = document.lineAt(i);
        const correctedLine = addMissingSemicolon(line.text);
        if (line.text !== correctedLine) {
            edits.push(vscode.TextEdit.replace(line.range, correctedLine));
        }
    }

    // TODO: ADD INDENTATION LATER
    // // indentation
    // const indentStyle = 'spaces'; // or 'tabs'
    // const indentSize = 4; // Number of spaces per level, if using spaces

    // for (let i = 0; i < document.lineCount; i++) {
    //     // console.log("checking indentation");
    //     const line = document.lineAt(i);
    //     // console.log("line", line);
    //     const expectedIndent = getExpectedIndent(line.text, indentStyle, indentSize);

    //     // If current line's indentation doesn't match the expected one, fix it
    //     if (!line.text.startsWith(expectedIndent)) {
    //         const correctedLine = `${expectedIndent}${line.text.trimStart()}`;
    //         edits.push(
    //             vscode.TextEdit.replace(
    //                 line.range,
    //                 correctedLine
    //             )
    //         );
    //     }
    // }

    return edits;
}


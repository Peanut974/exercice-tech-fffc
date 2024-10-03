import fs from 'fs';
import path from 'path';
import { Column, ColumnType } from './types.js';
import { format, isValid } from 'date-fns';

try {
    const inputFile = fs.readFileSync(path.join('test', 'inputFile'), 'utf8');
    const metadataFile = fs.readFileSync(path.join('test', 'metadataFile'), 'utf8');

    const correctColumnTypes = ['date', 'numérique', 'chaîne'];
    let columns: Column[] = [];

    /**
     * Vérification et traitement du fichier metadata
     */
    const metadataLines = metadataFile.split('\r\n');
    
    for (let i = 0; i < metadataLines.length; i++) {
        let line = metadataLines[i].split(',');
        if (line.length !== 3) {
            console.error(`Invalid metadata file: (line ${i + 1}) has ${line.length} columns (should have 3)`);
            process.exit(1);
        }
        let lineLength = parseInt(line[1]);
        if (isNaN(lineLength)) {
            console.error(`Invalid metadata file: (line ${i + 1}) column length ${lineLength} is not a valid number`);
            process.exit(1);
        }
        if (!correctColumnTypes.includes(line[2])) {
            console.error(`Invalid metadata file: (line ${i + 1}) column type '${line[2]}' is not supported`);
            process.exit(1);
        }
        columns.push({
            name: line[0],
            length: lineLength,
            type: line[2] as ColumnType
        })
    }

    let output = columns.map(col => col.name).join(',') + '\r\n'; // première ligne du fichier de sortie, contenant les noms des colonnes

    /**
     * Construction de la regex en fonction de la structure des colonnes
     */
    let regexParts = '';
    for (let col of columns) {
        switch (col.type) {
            case 'date':
                regexParts += `(\\d{4}-\\d{2}-\\d{2})`; // aaaa-mm-jj
                break;
            case 'numérique':
                regexParts += `(-?\\d+(?:\\.\\d+)?)`; // nombre décimal positif ou négatif
                break;
            case 'chaîne':
                regexParts += `([^\\s]+ )`; // chaîne de caractères sans espace, suivie d'un espace
                break;
        }
    }

    const regex = new RegExp(regexParts);

    /**
     * Vérification et traitement du fichier d'entrée
     */
    const metadataColumns = inputFile.split('\r\n');
    

    for (let i = 0; i < metadataColumns.length; i++) {
        let line = metadataColumns[i].match(regex);
        if (line === null) {
            console.error(`Error on line ${i + 1}: Invalid format`);
            continue;
        }
        for (let j = 0; j < columns.length; j++) {
            switch (columns[j].type) {
                case 'date':
                    if (!isValid(new Date(line[j + 1]))) {
                        console.error(`Invalid input file: (line ${i + 1}) date is invalid at column ${j + 1}`);
                        output += 'INVALID DATE';
                        break;
                    };
                    output += format(new Date(line[j + 1]), 'dd/MM/yyyy'); // on formate la date
                    break;
                case 'numérique':
                    let str1 = line[j + 1].substring(0, columns[j].length); // on tronque la chaîne si elle est trop longue
                    let float = parseFloat(str1); // on convertit la chaîne en nombre
                    output += float;
                    break;
                case 'chaîne':
                    let str2 = line[j + 1].trim(); // on retire le dernier espace
                    str2 = str2.substring(0, columns[j].length); // on tronque la chaîne si elle est trop longue
                    output += str2;
            }
            if (j < columns.length - 1) output += ','; // on ajoute une virgule si ce n'est pas la dernière colonne
        }
        output += '\r\n'; // on ajoute le CRLF
    }

    /**
     * Sauvegarde du  fichier converti
     */
    fs.writeFileSync(path.join('test', 'outputFile.csv'), output, 'utf8');
    console.log('File converted to CSV successfully ! Saved to test/outputFile.csv');
    process.exit(0);
} catch (error) {
    console.error(error);
    process.exit(1);
}

import Papa from 'papaparse';

export interface FileParser {
  parse(content: string): any[];
}

export class CSVParser implements FileParser {
  parse(content: string): any[] {
    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
    });
    return parsed.data;
  }
}

export class JSONParser implements FileParser {
  parse(content: string): any[] {
    return JSON.parse(content);
  }
}

export class ParserFactory {
  static getParser(mimetype: string | null, filename: string): FileParser {
    if (filename.endsWith('.csv') || mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
      return new CSVParser();
    }
    if (filename.endsWith('.json') || mimetype === 'application/json') {
      return new JSONParser();
    }
    throw new Error('Unsupported file format');
  }
}

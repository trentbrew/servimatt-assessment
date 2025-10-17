// File parsing utilities for RAG
import { init } from '@instantdb/admin';

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANTDB_ID!,
  adminToken: process.env.INSTANTDB_ADMIN_SECRET!,
});

export interface ParsedContent {
  filename: string;
  content: string;
  type: string;
  metadata?: Record<string, any>;
}

export async function parseFileContent(fileId: string, filename: string, type: string): Promise<ParsedContent> {
  try {
    console.log(`Fetching file: ${filename} (${fileId})`);
    
    // Query file metadata using Admin SDK
    const result = await db.query({
      $files: {
        $: { where: { id: fileId } }
      }
    });

    const file = result.$files[0];
    if (!file || !file.url) {
      throw new Error(`File not found: ${fileId}`);
    }

    // Fetch file content from the URL
    const response = await fetch(file.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const rawContent = await response.text();
    let content = '';
    let metadata = {};

    // Parse based on file type
    if (type === 'text/csv' || filename.endsWith('.csv')) {
      content = parseCSV(rawContent);
      metadata = { type: 'csv', rows: content.split('\n').length - 1 };
    } else if (type === 'application/json' || filename.endsWith('.json')) {
      content = parseJSON(rawContent);
      metadata = { type: 'json' };
    } else if (filename.endsWith('.md')) {
      content = rawContent;
      metadata = { type: 'markdown' };
    } else if (filename.endsWith('.txt')) {
      content = rawContent;
      metadata = { type: 'text' };
    } else if (filename.endsWith('.xlsx')) {
      // For XLSX, we'll treat it as text for now
      content = `Excel file: ${filename}\nNote: Full XLSX parsing requires additional libraries. File uploaded for reference.`;
      metadata = { type: 'xlsx' };
    } else {
      content = rawContent;
      metadata = { type: 'unknown' };
    }

    return {
      filename,
      content: content.substring(0, 50000), // Limit content size
      type,
      metadata
    };
  } catch (error) {
    console.error(`Error parsing file ${filename}:`, error);
    return {
      filename,
      content: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type,
      metadata: { type: 'error' }
    };
  }
}

function parseCSV(csvContent: string): string {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return 'Empty CSV file';
  
  const headers = lines[0];
  const dataRows = lines.slice(1, 11); // First 10 rows for preview
  
  let parsed = `CSV File Analysis:\nHeaders: ${headers}\n\nSample Data (first 10 rows):\n`;
  dataRows.forEach((row, idx) => {
    parsed += `Row ${idx + 1}: ${row}\n`;
  });
  
  if (lines.length > 11) {
    parsed += `\n... and ${lines.length - 11} more rows`;
  }
  
  return parsed;
}

function parseJSON(jsonContent: string): string {
  try {
    const data = JSON.parse(jsonContent);
    return `JSON File Analysis:\n${JSON.stringify(data, null, 2).substring(0, 2000)}`;
  } catch (error) {
    return `Invalid JSON file. Raw content preview:\n${jsonContent.substring(0, 1000)}`;
  }
}

export function createContextPrompt(files: ParsedContent[], userQuery: string): string {
  if (files.length === 0) return userQuery;

  const fileContexts = files.map(file => 
    `=== ${file.filename} ===\n${file.content}\n`
  ).join('\n');

  return `The user has uploaded ${files.length} file(s) for analysis. Please analyze the content and answer their question.

FILES UPLOADED:
${fileContexts}

USER QUESTION: ${userQuery}

Please provide a comprehensive analysis based on the uploaded files. If the user didn't ask a specific question, provide a summary of the key insights from the data.`;
}

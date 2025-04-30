import { GoogleAuth } from 'google-auth-library';
import { sheets_v4 } from '@googleapis/sheets';
import { Expense } from "./types/Expense";


const SPREADSHEET_ID = "1bY081aIOrp9YUsNniatAWtX_JhMWGArFJuAaELKkjNs";
const SHEET_NAME = "GastonSheet"

async function authenticate() {
  try {
    const credentialsJSON = JSON.parse(process.env.GOOGLE_CREDENTIALS || '');

    const auth = new GoogleAuth({
      credentials: credentialsJSON,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = new sheets_v4.Sheets({ auth: auth });

    return sheets; // Retornamos el objeto 'sheets' autenticado para usarlo después
  } catch (error) {
    console.error('Error al autenticar:', error);
    throw error;
  }
}

export const appendExpenseToSheet = async (user: string, expense: Expense) => {
    const sheets = await authenticate();
  
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[user, expense.category, expense.timestamp,expense.amount]],
      },
    });
  };

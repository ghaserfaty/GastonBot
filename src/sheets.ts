import { GoogleAuth } from "google-auth-library";
import { sheets_v4 } from "@googleapis/sheets";
import { Expense } from "./types/Expense";
import axios from "axios";

const SPREADSHEET_ID = "1bY081aIOrp9YUsNniatAWtX_JhMWGArFJuAaELKkjNs";
const SHEET_NAME = "GastonSheet";

export const getReport = async (user: string) => {
  const sheets = await authenticate();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_NAME,
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    return "La hoja está vacía.";
  }

  const encabezado = rows[0];
  const datos = rows.slice(1);

  const colUser = encabezado.indexOf("User");
  const colAmount = encabezado.indexOf("Amount (USD)");

  const total = datos
    .filter((row) => row[colUser]?.toLowerCase() === user)
    .reduce((sum, row) => sum + parseFloat(row[colAmount] || 0), 0);
  return total;
};

// Get total spending for a specific category in the current month (in USD)
export const getCategorySpending = async (
  user: string,
  category: string
): Promise<number> => {
  const sheets = await authenticate();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_NAME,
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    return 0;
  }

  const encabezado = rows[0];
  const datos = rows.slice(1);

  const colUser = encabezado.indexOf("User");
  const colCategory = encabezado.indexOf("Category");
  const colAmount = encabezado.indexOf("Amount (USD)");
  const colTimestamp = encabezado.indexOf("Timestamp");

  // Get current month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const total = datos
    .filter((row) => {
      const rowUser = row[colUser];
      const rowCategory = row[colCategory];
      const rowTimestamp = new Date(row[colTimestamp]);

      return (
        rowUser === user &&
        rowCategory === category &&
        rowTimestamp >= startOfMonth &&
        rowTimestamp <= endOfMonth
      );
    })
    .reduce((sum, row) => sum + parseFloat(row[colAmount] || 0), 0);

  return total;
};

async function authenticate() {
  try {
    const credentialsJSON = JSON.parse(process.env.GOOGLE_CREDENTIALS || "");

    const auth = new GoogleAuth({
      credentials: credentialsJSON,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = new sheets_v4.Sheets({ auth: auth });

    return sheets; // Retornamos el objeto 'sheets' autenticado para usarlo después
  } catch (error) {
    console.error("Error al autenticar:", error);
    throw error;
  }
}

export const appendExpenseToSheet = async (user: string, expense: Expense) => {
  const sheets = await authenticate();
  const usdValue = await getBlueDollarRate();
  let usdAmount = 0;
  if (usdValue) {
    usdAmount = expense.amount / usdValue;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          user,
          expense.category,
          expense.timestamp,
          expense.amount,
          usdValue,
          usdAmount,
        ],
      ],
    },
  });
};

async function getBlueDollarRate(): Promise<number | null> {
  try {
    const response = await axios.get("https://api.bluelytics.com.ar/v2/latest");
    return response.data.blue.value_buy; // o value_avg, según prefieras
  } catch (error) {
    console.error("Error al obtener la cotización del dólar:", error);
    return null;
  }
}

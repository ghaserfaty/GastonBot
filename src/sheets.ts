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

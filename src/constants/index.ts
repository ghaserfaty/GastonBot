export const categories = [
    { label: "🛒 Supermercado", value: "Supermercado" },
    { label: "🍺 Ocio/Salidas", value: "Ocio/Salidas" },
    { label: "🚗 Transporte", value: "Transporte" },
    { label: "💊 Farmacia", value: "Farmacia" },
    { label: "👕 Ropa", value: "Ropa" },
  ];

// Spending limits per category in USD
export const categoryLimits: Record<string, number> = {
  "Supermercado": 400,
  "Ocio/Salidas": 150,
  "Transporte": 100,
  "Farmacia": 80,
  "Ropa": 200,
};

// Warning threshold percentage (warn when reaching this % of the limit)
export const WARNING_THRESHOLD = 0.8;

export const isAllowedUser = (chatId: number) => {
  const allowedUsers = ["1338920278", "1817312721"];
  return allowedUsers.indexOf(chatId.toString()) !== -1;
};
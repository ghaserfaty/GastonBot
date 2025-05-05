export const categories = [
    { label: "🛒 Supermercado", value: "Supermercado" },
    { label: "🌿 Weed", value: "Weed" },
    { label: "🍕 Delivery", value: "Delivery" },
    { label: "🍽️ Comidas afuera", value: "Comidas afuera" },
    { label: "📺 Ocio", value: "Ocio" },
    { label: "🍺 Salidas", value: "Salidas" },
    { label: "🚗 Transporte", value: "Transporte" },
    { label: "💊 Farmacia", value: "Farmacia" },
    { label: "🏋️‍♂️ Salud & Gimnasio", value: "Salud & Gimnasio" },
    { label: "👕 Ropa", value: "Ropa" },
    { label: "🎁 Regalos & Donaciones", value: "Regalos & Donaciones" },
    { label: "📚 Educación", value: "Educación" },
    { label: "🧼 Hogar", value: "Hogar" },
    { label: "🐾 Mascotas", value: "Mascotas" },
  ];
9
  export const isAllowedUser = (chatId: number) => {
    const allowedUsers = ["1338920278", "1817312721"];
    return allowedUsers.indexOf(chatId.toString()) !== -1;
  }
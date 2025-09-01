/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-blue': '#0066cc',
        'medical-green': '#00cc66',
        'medical-red': '#cc0000',
        'chat-bg': '#f8fafc',
        'message-user': '#e3f2fd',
        'message-ai': '#f3e5f5',
        'message-system': '#fff3e0'
      },
      fontFamily: {
        'medical': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        medthread: {
          "primary": "#0066cc",
          "secondary": "#00cc66",
          "accent": "#cc0000",
          "neutral": "#3d4451",
          "base-100": "#ffffff",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
      "light",
      "dark"
    ],
    base: true,
    styled: true,
    utils: true,
    rtl: false,
    prefix: "",
    logs: true,
  },
}
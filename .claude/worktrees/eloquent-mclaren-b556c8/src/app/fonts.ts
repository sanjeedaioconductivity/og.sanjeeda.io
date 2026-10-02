import localFont from "next/font/local";

export const jameelNoori = localFont({
  src: [
    {
      path: "./fonts/JameelNooriNastaleeqRegular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-jameel",
  display: "swap",
});
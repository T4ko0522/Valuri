import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Valuri',
  description: 'Valorant Utility Tauri Windows Native Application',
  icons: {
    icon: [
      //FIXME - faviconないから適当に俺のアイコン入れとく
      {url: "/favicon.ico"}
    ]
  },

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

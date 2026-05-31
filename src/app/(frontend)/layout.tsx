import React from 'react'
import '@/styles/globals.css'

export const metadata = {
  description: 'Network operations dashboard',
  title: 'Network Operations Dashboard',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}

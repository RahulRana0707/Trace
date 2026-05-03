import * as React from "react"

type LogoVariant = "brand" | "light" | "dark"

interface TraceLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: LogoVariant
  size?: number | string
  showText?: boolean
}

export const TraceLogo: React.FC<TraceLogoProps> = ({
  variant = "brand",
  size = 44,
  showText = true,
  ...props
}) => {
  const colors = {
    brand: {
      symbol: "#10B981",
      text: "#111827",
      accent: "#10B981",
    },
    light: {
      symbol: "#FFFFFF",
      text: "#FFFFFF",
      accent: "#FFFFFF",
    },
    dark: {
      symbol: "#111827",
      text: "#111827",
      accent: "#10B981",
    },
  }

  const { symbol, text, accent } = colors[variant]
  const viewBox = showText ? "0 0 286 72" : "0 0 72 72"
  const aspectRatio = showText ? 286 / 72 : 1
  const width =
    typeof size === "number" ? Math.round(size * aspectRatio) : undefined

  return (
    <svg
      width={width ?? size}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M36 6.5C32 6.5 28.3 8.7 26.4 12.1L8.2 45.2C6.3 48.5 6.4 52.6 8.3 55.8C10.2 59 13.6 61 17.3 61H25.3C28.7 61 31.7 58.7 33.1 55.6L35.1 50.9H36.9L38.9 55.6C40.3 58.7 43.3 61 46.7 61H54.7C58.4 61 61.8 59 63.7 55.8C65.6 52.6 65.7 48.5 63.8 45.2L45.6 12.1C43.7 8.7 40 6.5 36 6.5Z"
        fill={symbol}
      />
      <path
        d="M26 42.5C26 35.9 31.4 30.5 38 30.5C44.6 30.5 50 35.9 50 42.5V43.2C50 45.7 48 47.7 45.5 47.7H30.5C28 47.7 26 45.7 26 43.2V42.5Z"
        fill="white"
      />
      <circle cx="34" cy="39.2" r="2.1" fill={symbol} />
      <circle cx="38" cy="39.2" r="2.1" fill={symbol} />
      <circle cx="42" cy="39.2" r="2.1" fill={symbol} />

      {showText && (
        <g fill={text}>
          <path d="M94.8 52.8C84.9 52.8 77.6 45.8 77.6 36.1C77.6 26.4 84.8 19.3 94.5 19.3C104 19.3 110.8 25.9 110.8 35.7V40.5H88.7C89.5 44.8 92.7 47.3 97 47.3C100.4 47.3 102.8 45.9 104.7 43.5L109.9 47.5C106.6 51.5 102 52.8 94.8 52.8ZM88.9 33.2H101.1C100.4 29.5 97.9 27.1 94.3 27.1C90.7 27.1 88.9 29.5 88.9 33.2Z" />
          <path d="M134.1 52.8C123.8 52.8 116 45.2 116 36.1C116 27 123.8 19.3 134.1 19.3C140.7 19.3 145.5 22 148.6 26.5L141.6 31.4C140.1 29.2 137.7 27.8 134.5 27.8C129.4 27.8 125.8 31.4 125.8 36.1C125.8 40.8 129.4 44.3 134.5 44.3C137.8 44.3 140.3 42.8 141.8 40.5L148.8 45.4C145.6 49.9 140.8 52.8 134.1 52.8Z" />
          <path d="M170.5 52.8C162.6 52.8 158 48.4 158 40.5V28.7H152.8V20.2H158V10.9H167.7V20.2H176.3V28.7H167.7V38.6C167.7 42.2 169.2 43.9 172 43.9C173.4 43.9 174.7 43.5 175.8 43V51.5C174.3 52.3 172.4 52.8 170.5 52.8Z" />
          <path d="M182.8 52V20.2H192.5V52H182.8Z" />
          <path d="M203.2 52V28.7H198V20.2H203.2V18.8C203.2 11.2 208.1 6.5 216 6.5C218.2 6.5 220.5 6.8 222.1 7.4V15.8C221.1 15.3 219.7 15 218.4 15C214.9 15 212.9 16.8 212.9 20.3V20.2H221.8V28.7H212.9V52H203.2Z" />
          <path d="M240.4 52.8C230.6 52.8 223 45.1 223 36C223 26.9 230.7 19.3 240.6 19.3C250.5 19.3 258.2 26.9 258.2 36C258.2 45.1 250.4 52.8 240.4 52.8ZM240.6 44.3C245.3 44.3 248.4 40.7 248.4 36C248.4 31.3 245.3 27.8 240.6 27.8C235.8 27.8 232.7 31.3 232.7 36C232.7 40.7 235.8 44.3 240.6 44.3Z" />
        </g>
      )}

      {showText && <circle cx="187.6" cy="12.5" r="4.4" fill={accent} />}
    </svg>
  )
}

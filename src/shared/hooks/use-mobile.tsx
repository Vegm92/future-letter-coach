import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check if matchMedia is supported and mql is not null
    if (mql && mql.addEventListener) {
      mql.addEventListener("change", onChange)
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return () => mql.removeEventListener("change", onChange)
    } else {
      // Fallback when matchMedia is not supported
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return () => {}
    }
  }, [])

  return !!isMobile
}

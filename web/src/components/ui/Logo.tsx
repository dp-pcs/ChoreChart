'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom'
  width?: number
  height?: number
  className?: string
  alt?: string
  priority?: boolean
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 64, height: 64 },
  xl: { width: 128, height: 128 },
}

export function Logo({ 
  size = 'md', 
  width, 
  height, 
  className,
  alt = 'Chorbie Logo',
  priority = false
}: LogoProps) {
  const dimensions = size === 'custom' && width && height 
    ? { width, height }
    : sizeMap[size as keyof typeof sizeMap]

  return (
    <Image
      src="/chorbie_logo_transparent.png"
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      className={cn("object-contain", className)}
      priority={priority}
      quality={85}
    />
  )
}

export default Logo
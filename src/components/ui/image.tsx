import { CSSProperties, ImgHTMLAttributes } from 'react'

interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fill?: boolean
  sizes?: string
}

export default function Image({ fill, sizes, className, style, ...props }: ImageProps) {
  if (fill) {
    return (
      <img
        {...props}
        className={`absolute inset-0 w-full h-full ${className || ''}`}
        style={{
          objectFit: 'cover',
          ...style
        }}
      />
    )
  }

  return <img {...props} className={className} style={style} />
}
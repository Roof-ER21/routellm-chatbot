/**
 * S21 Badge Component - Susan AI-21 Logo
 * Red/White/Black color scheme badge design
 */

interface S21BadgeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function S21Badge({ size = 'lg', className = '' }: S21BadgeProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg border-2',
    md: 'w-20 h-20 text-2xl border-3',
    lg: 'w-32 h-32 text-5xl border-4',
    xl: 'w-40 h-40 text-6xl border-4'
  }

  return (
    <div className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 border-white shadow-2xl ${sizeClasses[size]} ${className}`}>
      {/* Inner glow ring */}
      <div className="absolute inset-3 rounded-full border border-white opacity-20"></div>

      {/* S21 Text */}
      <div className="font-black text-white tracking-tight">
        S21
      </div>

      {/* Subtle black accent (bottom shadow) */}
      <div className="absolute bottom-1 right-1 w-2 h-2 bg-black/20 rounded-full blur-sm"></div>
    </div>
  )
}

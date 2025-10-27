/**
 * A21 Badge Component - Agnes AI-21 Logo
 * Red/White/Black color scheme badge design
 * Trainer/Coach personality styling
 */

interface A21BadgeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function A21Badge({ size = 'lg', className = '' }: A21BadgeProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg border-2',
    md: 'w-20 h-20 text-2xl border-3',
    lg: 'w-32 h-32 text-5xl border-4',
    xl: 'w-40 h-40 text-6xl border-4'
  }

  return (
    <div className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-red-700 to-red-800 border-white shadow-2xl ${sizeClasses[size]} ${className}`}>
      {/* Inner coaching ring (double border for mentor feel) */}
      <div className="absolute inset-3 rounded-full border-2 border-white opacity-25"></div>
      <div className="absolute inset-4 rounded-full border border-white opacity-15"></div>

      {/* A21 Text */}
      <div className="font-black text-white tracking-tight">
        A21
      </div>

      {/* Coach whistle accent (top left) */}
      <div className="absolute top-2 left-2 w-3 h-3 bg-white/30 rounded-full"></div>

      {/* Subtle black accent (bottom shadow) */}
      <div className="absolute bottom-1 right-1 w-2 h-2 bg-black/30 rounded-full blur-sm"></div>
    </div>
  )
}

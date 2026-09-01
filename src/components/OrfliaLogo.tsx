'use client'

interface OrfliaLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showBadge?: boolean
}

export function OrfliaLogo({
  className = '',
  size = 'lg',
  showBadge = true,
}: OrfliaLogoProps) {
  const sizeClasses = {
    sm: 'text-xl tracking-tight',
    md: 'text-2xl sm:text-[28px] tracking-tight',
    lg: 'text-3xl sm:text-[34px] tracking-tight',
    xl: 'text-4xl sm:text-5xl tracking-tight',
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Tipografia da Logo com Identidade Visual Exata */}
      <div className={`font-sans font-normal leading-none ${sizeClasses[size]}`}>
        {/* Parte 'orfl': Cinza no Light mode / Branco puro no Dark mode */}
        <span className="text-zinc-400 dark:text-zinc-100 font-medium transition-colors duration-200">
          orfl
        </span>
        {/* Parte 'ia': Laranja Corporativo */}
        <span className="text-orange-500 font-bold">
          ia
        </span>
      </div>

      {/* Badge OS Internas Corporativo */}
      {showBadge && (
        <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg bg-orange-50 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 uppercase tracking-wider">
          O.S Internas
        </span>
      )}
    </div>
  )
}

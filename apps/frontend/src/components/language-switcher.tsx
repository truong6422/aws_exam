import { useTranslation } from 'react-i18next'

interface LanguageSwitcherProps {
    variant?: 'floating' | 'navbar'
}

const GlobeIcon = ({ className }: { className?: string }) => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
)

export default function LanguageSwitcher({ variant = 'floating' }: LanguageSwitcherProps) {
    const { i18n } = useTranslation()

    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi'
        i18n.changeLanguage(newLang)
    }

    if (variant === 'navbar') {
        return (
            <button
                onClick={toggleLanguage}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-all hover:bg-white/10"
                style={{
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                }}
                title="Switch Language"
            >
                <GlobeIcon className="opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider">
                    <span className={i18n.language === 'vi' ? 'text-white' : 'text-white/40'}>VI</span>
                    <span className="h-2 w-px bg-white/20" />
                    <span className={i18n.language === 'en' ? 'text-white' : 'text-white/40'}>EN</span>
                </div>
            </button>
        )
    }

    return (
        <button
            onClick={toggleLanguage}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/25 hover:scale-105 active:scale-95 shadow-2xl"
            style={{
                fontFamily: "'SF Pro Display', sans-serif",
                border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
        >
            <GlobeIcon className="text-white/80" />
            <div className="flex items-center gap-2">
                <span className={i18n.language === 'vi' ? 'text-white' : 'text-white/40'}>VI</span>
                <span className="h-3 w-px bg-white/30" />
                <span className={i18n.language === 'en' ? 'text-white' : 'text-white/40'}>EN</span>
            </div>
        </button>
    )
}

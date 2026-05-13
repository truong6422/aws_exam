import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface DonateModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DonateModal({ isOpen, onClose }: DonateModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [qrLoaded, setQrLoaded] = useState(false)
  const [qrZoomed, setQrZoomed] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setQrLoaded(false)
      setQrZoomed(false)
      requestAnimationFrame(() => {
        setRendered(true)
        requestAnimationFrame(() => setVisible(true))
      })
    } else {
      setVisible(false)
      const timer = setTimeout(() => setRendered(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Prevent body scroll when zoomed
  useEffect(() => {
    if (qrZoomed) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [qrZoomed])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!rendered) return null

  return (
    <>
      {/* Main Modal - Nhỏ gọn, không scroll */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{
          background: visible ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)',
          backdropFilter: visible ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: visible ? 'blur(12px)' : 'none',
          transition: 'background 0.4s ease, backdrop-filter 0.4s ease',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={t('donate.aria_modal')}
      >
        <div
          className="w-full overflow-hidden"
          style={{
            maxWidth: '440px',
            background: 'linear-gradient(180deg, #1a1a1c 0%, #0f0f11 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 30px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(24px)',
            transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header với icon trà đá */}
          <div
            className="relative px-8 pt-8 pb-0"
            style={{
              background: 'linear-gradient(180deg, rgba(96,125,139,0.12) 0%, transparent 100%)',
              textAlign: 'center',
            }}
          >
            <button
              onClick={onClose}
              aria-label={t('donate.close')}
              className="absolute right-5 top-5 cursor-pointer rounded-full transition-all duration-200 hover:scale-110"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '14px',
              }}
            >
              ✕
            </button>

            {/* Icon cốc trà đá - căn giữa */}
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #90a4ae, #607d8b)',
                borderRadius: '50%',
                boxShadow: '0 8px 32px rgba(96,125,139,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
                <path
                  d="M5 5h12l-1.5 14H6.5L5 5z"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="rgba(255,255,255,0.1)"
                />
                <path
                  d="M5.5 9c0 2.5 2 4.5 5.5 4.5s5.5-2 5.5-4.5"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M4 5h14"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <ellipse cx="8.5" cy="13" rx="1.5" ry="1" fill="rgba(255,255,255,0.7)" />
                <ellipse cx="12" cy="14" rx="1.8" ry="1.2" fill="rgba(255,255,255,0.6)" />
                <ellipse cx="15" cy="12.5" rx="1.3" ry="0.9" fill="rgba(255,255,255,0.65)" />
                <path
                  d="M16 3l2 7"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            

            <h2
              style={{
                fontFamily: "'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-0.4px',
                margin: '0 0 4px',
                textAlign: 'center',
              }}
            >
              {t('donate.title')}
            </h2>
            <p
              style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.4,
                margin: 0,
                textAlign: 'center',
                paddingBottom: '16px',
              }}
            >
              {t('donate.subtitle')}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 pb-6">
            {/* QR Code section - Tập trung vào QR */}
            <div className="mx-auto mb-4 flex flex-col items-center justify-center">
              {/* QR Container */}
              <div
                className="relative cursor-pointer transition-all duration-300"
                style={{
                  padding: '12px',
                  background: '#fff',
                  borderRadius: '16px',
                  boxShadow: visible
                    ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 3px rgba(96,125,139,0.2)'
                    : '0 0 0 3px rgba(96,125,139,0)',
                  transform: visible ? 'rotate(0deg)' : 'rotate(-2deg)',
                  transition: 'all 0.4s ease',
                }}
                onClick={() => setQrZoomed(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setQrZoomed(true)}
                aria-label={t('donate.click_to_zoom')}
              >
                {/* Zoom hint */}
                <div
                  className="absolute -right-2 -top-2 flex items-center gap-1 px-2 py-1.5"
                  style={{
                    background: 'rgba(0,0,0,0.8)',
                    borderRadius: '10px',
                    fontSize: '10px',
                    color: '#fff',
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
                  </svg>
                  {t('donate.tap_to_zoom')}
                </div>

                {/* Loading skeleton */}
                {!qrLoaded && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background: '#fff',
                      borderRadius: '8px',
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: '200px',
                        height: '200px',
                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                )}

                <img
                  src="/images/donate-qr.png"
                  alt={t('donate.qr_alt')}
                  className="block"
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                    opacity: qrLoaded ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                  }}
                  onLoad={() => setQrLoaded(true)}
                />
              </div>

              {/* Bank badge */}
              <div
                className="mt-3 flex items-center gap-2 px-3 py-1.5"
                style={{
                  background: 'rgba(96,125,139,0.1)',
                  borderRadius: '16px',
                  border: '1px solid rgba(96,125,139,0.15)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="#90a4ae" strokeWidth="1.5" />
                  <path d="M2 10h20" stroke="#90a4ae" strokeWidth="1.5" />
                </svg>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#90a4ae',
                  }}
                >
                  MB Bank
                </span>
              </div>

              <p
                className="mt-2 text-center"
                style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                {t('donate.scan_hint')}
              </p>
            </div>

            {/* Story - Rút gọn */}
            <div
              className="mb-4 p-3"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.6,
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                {t('donate.story')}
              </p>
            </div>

            {/* CTA buttons */}
            <button
              onClick={onClose}
              className="group relative w-full cursor-pointer overflow-hidden rounded-xl px-4 py-3 transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(135deg, #90a4ae 0%, #607d8b 100%)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(96,125,139,0.3)',
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                  animation: 'shine 2.5s infinite',
                }}
              />
              <span
                className="relative z-10 flex items-center justify-center gap-2"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                <span style={{ fontSize: '16px' }}>🧊</span>
                {t('donate.cta_support')}
              </span>
            </button>

            <button
              onClick={onClose}
              className="mt-2 w-full cursor-pointer rounded-xl px-4 py-2.5 transition-all duration-200 hover:bg-white/5"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '12px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {t('donate.maybe_later')}
            </button>

            <p
              className="mt-3 text-center"
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              {t('donate.footer')}
            </p>
          </div>
        </div>
      </div>

      {/* QR Zoom Overlay - CHỈ hiện ảnh QR với nền đen */}
      {qrZoomed && (
        <div
          className="fixed inset-0 z-[300] flex cursor-pointer items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
          onClick={() => setQrZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('donate.qr_zoomed')}
        >
          {/* QR phóng to */}
          <div
            style={{
              animation: 'zoom-in 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* QR lớn */}
            <img
              src="/images/donate-qr.png"
              alt={t('donate.qr_alt')}
              style={{
                width: 'min(85vw, 380px)',
                height: 'min(85vw, 380px)',
                objectFit: 'contain',
                borderRadius: '16px',
                padding: '20px',
                background: '#fff',
                boxShadow: '0 0 80px rgba(96,125,139,0.4)',
              }}
            />

            {/* Hint */}
            <p
              className="mt-4 text-center"
              style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {t('donate.zoom_hint')}
            </p>
          </div>

          {/* Close button góc trên */}
          <button
            onClick={() => setQrZoomed(false)}
            aria-label={t('donate.close_zoom')}
            className="absolute right-6 top-6 cursor-pointer rounded-full transition-all duration-200 hover:scale-110"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes pulse-glow-tea {
          0%, 100% { box-shadow: 0 8px 32px rgba(96,125,139,0.45); }
          50% { box-shadow: 0 8px 48px rgba(96,125,139,0.65); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes shine {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(200%); }
        }
        @keyframes zoom-in {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}

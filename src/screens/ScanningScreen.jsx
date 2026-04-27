import { useEffect, useRef, useState } from 'react'
import { theme } from '../theme/theme.js'
import { useScan } from '../hooks/useScan.js'

const MOCK_MESSAGES = [
  'Reading wines from list…',
  'Identifying wines…',
  'Matching to database…',
  'Done ✓',
]

const REAL_MESSAGES = [
  'Uploading photo…',
  'Identifying wines…',
  'Looking up ratings…',
  'Done ✓',
]

export default function ScanningScreen({ navigate, file, onScanComplete }) {
  const [msgIdx, setMsgIdx] = useState(0)
  const { scanImage } = useScan()
  const hasRun = useRef(false)

  const messages = file ? REAL_MESSAGES : MOCK_MESSAGES

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    if (!file) {
      // Mock flow — no image provided
      const timers = [
        setTimeout(() => setMsgIdx(1), 700),
        setTimeout(() => setMsgIdx(2), 1500),
        setTimeout(() => setMsgIdx(3), 2200),
        setTimeout(() => navigate('anonResults'), 2700),
      ]
      return () => timers.forEach(clearTimeout)
    }

    // Real scan flow
    const t1 = setTimeout(() => setMsgIdx(1), 1500)
    const t2 = setTimeout(() => setMsgIdx(2), 4500)

    scanImage(file).then(wines => {
      clearTimeout(t1)
      clearTimeout(t2)
      setMsgIdx(3)
      setTimeout(() => {
        if (wines?.length && onScanComplete) {
          onScanComplete(wines)
        } else {
          navigate('anonResults')
        }
      }, 600)
    })

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xl,
        padding: theme.spacing.xl,
      }}
    >
      {/* Camera frame */}
      <div
        style={{
          width: 260,
          height: 180,
          position: 'relative',
          border: `1.5px solid ${theme.colors.gold}80`,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: '#111',
        }}
      >
        {[
          { top: -1, left: -1, borderTop: `2px solid ${theme.colors.gold}`, borderLeft: `2px solid ${theme.colors.gold}` },
          { top: -1, right: -1, borderTop: `2px solid ${theme.colors.gold}`, borderRight: `2px solid ${theme.colors.gold}` },
          { bottom: -1, left: -1, borderBottom: `2px solid ${theme.colors.gold}`, borderLeft: `2px solid ${theme.colors.gold}` },
          { bottom: -1, right: -1, borderBottom: `2px solid ${theme.colors.gold}`, borderRight: `2px solid ${theme.colors.gold}` },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 16, height: 16, ...s }} />
        ))}

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: theme.colors.gold,
            boxShadow: `0 0 8px ${theme.colors.gold}`,
            animation: 'scanLine 1.2s ease-in-out infinite alternate',
            top: 4,
          }}
        />

        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              height: 8,
              top: 24 + i * 28,
              backgroundColor: '#ffffff10',
              borderRadius: 2,
              animation: 'pulse 2s ease infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Status message */}
      <div
        style={{
          fontSize: theme.typography.sizes.md,
          color: theme.colors.cream,
          fontFamily: theme.typography.fontSans,
          animation: 'pulse 1.5s ease infinite',
          letterSpacing: '0.02em',
        }}
      >
        {messages[msgIdx]}
      </div>
    </div>
  )
}

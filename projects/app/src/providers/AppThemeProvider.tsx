import { StyleProvider } from '@ant-design/cssinjs'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type ThemeMode } from './themeContext'

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light')
  const isDark = mode === 'dark'

  const contextValue = useMemo(() => ({ mode, isDark, setMode }), [mode, isDark])

  return (
    <ThemeContext.Provider value={contextValue}>
      <StyleProvider layer>
        <ConfigProvider
          locale={zhCN}
          theme={{
            algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorPrimary: '#22d3ee',
              borderRadius: 8,
              colorBgBase: isDark ? '#050816' : '#f7fafc',
              colorTextBase: isDark ? '#e5edf8' : '#0f172a',
              fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
            },
            components: {
              Button: {
                controlHeight: 36,
                fontWeight: 700,
              },
              Tag: {
                borderRadiusSM: 999,
              },
            },
          }}
        >
          {children}
        </ConfigProvider>
      </StyleProvider>
    </ThemeContext.Provider>
  )
}

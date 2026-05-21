import { StyleProvider } from '@ant-design/cssinjs'
import { App as AntdApp, ConfigProvider, theme } from 'antd'
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
              colorPrimary: '#4f46e5',
              borderRadius: 8,
              colorBgBase: isDark ? '#0f172a' : '#f8fafc',
              colorTextBase: isDark ? '#e5edf8' : '#0f172a',
              colorBorder: isDark ? '#1e293b' : '#e2e8f0',
              colorFillSecondary: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.04)',
              controlOutline: isDark ? 'rgba(129, 140, 248, 0.26)' : 'rgba(79, 70, 229, 0.18)',
              fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
            },
            components: {
              Button: {
                controlHeight: 36,
                fontWeight: 650,
              },
              Segmented: {
                itemSelectedBg: isDark ? '#1e293b' : '#ffffff',
                itemSelectedColor: isDark ? '#e0e7ff' : '#3730a3',
              },
              Steps: {
                colorPrimary: '#4f46e5',
              },
              Tag: {
                borderRadiusSM: 999,
              },
            },
          }}
        >
          <AntdApp>
            {children}
          </AntdApp>
        </ConfigProvider>
      </StyleProvider>
    </ThemeContext.Provider>
  )
}

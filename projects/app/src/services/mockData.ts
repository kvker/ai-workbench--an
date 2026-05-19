import mockJson from './mock.json?raw'
import type { WorkbenchMockData } from './types'

export const mockData = JSON.parse(mockJson) as WorkbenchMockData

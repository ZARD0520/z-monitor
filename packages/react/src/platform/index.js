import { register, ERROR, createRouterMonitor } from './react'

export function usePlatform(platform) {
  if (platform === 'react') {
    return {
      register,
      ERROR,
      createRouterMonitor
    }
  }
}
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('globetrotter_token')

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.localStorage.removeItem('globetrotter_token')
      window.dispatchEvent(new Event('globetrotter:unauthorized'))
    }

    return Promise.reject(error)
  },
)

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg ?? 'Invalid input').join(', ')
    }

    if (!error.response) {
      return `Unable to reach the GlobeTrotter API at ${API_BASE_URL}. Start the backend server and try again.`
    }

    return error.message || 'Something went wrong while contacting the server.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while contacting the server.'
}

import { type FormEvent, useState } from 'react'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { ErrorAlert } from '../components/ErrorAlert'
import { useAuth } from '../hooks/useAuth'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please complete all fields to create your account.')
      return
    }

    setIsSubmitting(true)

    try {
      await register(fullName.trim(), email.trim(), password)
      navigate('/login', { replace: true })
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to create your account.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9ff] p-4 text-[#0b1c30]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#d3e4fe] bg-[#ffffff] shadow-[0_18px_50px_rgba(11,28,48,0.12)]">
        <div className="p-6 md:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-black tracking-[-0.04em] text-[#006194]">GlobeTrotter</h1>
            <p className="mt-2 text-base text-[#3f4850]">Your Expert Concierge</p>
          </div>

          <div className="mb-6">
            <h2 className="text-center text-[1.5rem] font-semibold text-[#0b1c30]">Create Account</h2>
          </div>

          {error ? (
            <div className="mb-4">
              <ErrorAlert message={error} />
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-name" className="mb-2 block text-sm font-semibold text-[#3f4850]">
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-[#d3e4fe] bg-[#f8f9ff] px-3 py-3 text-base text-[#0b1c30] outline-none transition focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-[#3f4850]">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="traveler@example.com"
                className="w-full rounded-xl border border-[#d3e4fe] bg-[#f8f9ff] px-3 py-3 text-base text-[#0b1c30] outline-none transition focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                autoComplete="email"
                required
              />
            </div>

            <div className="relative">
              <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-[#3f4850]">
                Password
              </label>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#d3e4fe] bg-[#f8f9ff] px-3 py-3 pr-11 text-base text-[#0b1c30] outline-none transition focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-[2.6rem] text-[#3f4850] transition hover:text-[#006194]"
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#006194] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#007bb9] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>{isSubmitting ? 'Creating account...' : 'Sign Up'}</span>
              <UserPlus size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#3f4850]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#006194] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

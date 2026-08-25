type ErrorAlertProps = {
  message: string
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#ffdad6] bg-[#ffdad6] p-4 text-sm text-[#93000a] shadow-sm">
      <span className="material-symbols-outlined text-lg">error</span>
      <span>{message}</span>
    </div>
  )
}

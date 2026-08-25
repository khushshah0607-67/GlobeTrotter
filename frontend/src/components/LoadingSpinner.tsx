export function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9ff] text-[#006194]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#dce9ff] border-t-[#006194]" />
        <p className="text-sm font-medium text-[#3f4850]">Loading...</p>
      </div>
    </div>
  )
}

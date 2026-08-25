import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { apiClient, getApiErrorMessage } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { useAuth } from '../hooks/useAuth'

type Role = 'owner' | 'editor' | 'viewer'

type Member = {
  id: string
  trip_id: string
  user_id: string
  role: Role
  joined_at: string
  full_name: string
  email: string
}

type Trip = {
  title: string
  status: string
}

const getInitials = (name: string) => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

const roleLabel = (role: Role) => role.charAt(0).toUpperCase() + role.slice(1)

export function CollaborationPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('editor')
  const [removingMember, setRemovingMember] = useState<Member | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => (await apiClient.get(`/api/v1/trips/${tripId}`)).data as Trip,
    enabled: Boolean(tripId),
  })

  const membersQuery = useQuery({
    queryKey: ['trip', tripId, 'members'],
    queryFn: async () => (await apiClient.get(`/api/v1/trips/${tripId}/members`)).data as Member[],
    enabled: Boolean(tripId),
  })

  const invalidateMembers = () => {
    queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'members'] })
  }

  const addMemberMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/api/v1/trips/${tripId}/members`, { email, role })).data as Member,
    onSuccess: () => {
      invalidateMembers()
      setEmail('')
      setRole('editor')
      setIsAddOpen(false)
      setNotice('Member added to this trip.')
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ member, nextRole }: { member: Member; nextRole: Role }) => (await apiClient.patch(`/api/v1/trips/${tripId}/members/${member.user_id}`, { role: nextRole })).data as Member,
    onSuccess: () => {
      invalidateMembers()
      setNotice('Member role updated.')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (member: Member) => apiClient.delete(`/api/v1/trips/${tripId}/members/${member.user_id}`),
    onSuccess: () => {
      invalidateMembers()
      setRemovingMember(null)
      setNotice('Member removed from this trip.')
    },
  })

  const members = membersQuery.data ?? []
  const canManageMembers = members.some((member) => member.user_id === user?.id && member.role === 'owner')
  const mutationError = addMemberMutation.error ?? updateRoleMutation.error ?? removeMemberMutation.error
  const error = membersQuery.error ?? tripQuery.error ?? mutationError

  const submitAddMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(null)
    addMemberMutation.mutate()
  }

  const confirmRemove = () => {
    if (removingMember) removeMemberMutation.mutate(removingMember)
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <header className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-[#d3e4fe] bg-[#f8f9ff]/90 px-6 py-4 backdrop-blur-sm">
        <button type="button" onClick={() => navigate('/dashboard')} className="text-[24px] font-bold tracking-tight text-[#006194]">GlobeTrotter</button>
        <nav className="hidden items-center gap-6 md:flex"><button type="button" onClick={() => navigate('/dashboard')} className="text-sm font-medium text-[#3f4850] hover:text-[#006194]">Dashboard</button><span className="border-b-2 border-[#006194] pb-1 text-sm font-semibold text-[#006194]">Trips</span><button type="button" onClick={() => navigate(`/trip/${tripId}/budget`)} className="text-sm font-medium text-[#3f4850] hover:text-[#006194]">Budget</button></nav>
        <div className="flex items-center gap-3 text-[#006194]"><button type="button" aria-label="Notifications" className="rounded-full p-2 hover:bg-[#eff4ff]"><span className="material-symbols-outlined">notifications</span></button><button type="button" aria-label="Settings" className="rounded-full p-2 hover:bg-[#eff4ff]"><span className="material-symbols-outlined">settings</span></button><span className="material-symbols-outlined">account_circle</span></div>
      </header>

      <aside className="fixed left-0 top-16 hidden h-[calc(100vh-64px)] w-64 flex-col border-r border-[#d3e4fe] bg-[#eff4ff] p-4 lg:flex">
        <div className="mb-8 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded bg-[#007bb9] text-white"><span className="material-symbols-outlined">flight_takeoff</span></div><div className="min-w-0"><h2 className="truncate text-[1.1rem] font-bold text-[#006194]">{tripQuery.data?.title ?? 'Current Trip'}</h2><p className="text-sm capitalize text-[#3f4850]">{tripQuery.data?.status ?? 'Planning'}</p></div></div>
        <nav className="flex flex-1 flex-col gap-2"><button type="button" onClick={() => navigate(`/trip/${tripId}`)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[#3f4850] hover:bg-[#dce9ff]"><span className="material-symbols-outlined">dashboard</span>Overview</button><button type="button" onClick={() => navigate(`/trip/${tripId}/itinerary`)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[#3f4850] hover:bg-[#dce9ff]"><span className="material-symbols-outlined">event_note</span>Itinerary</button><button type="button" onClick={() => navigate(`/trip/${tripId}/budget`)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[#3f4850] hover:bg-[#dce9ff]"><span className="material-symbols-outlined">payments</span>Budget</button><button type="button" className="flex items-center gap-3 rounded-xl bg-[#cce5ff] px-3 py-2 font-bold text-[#004b73]"><span className="material-symbols-outlined">group</span>Members</button></nav>
        <div className="border-t border-[#bfc7d2] pt-4"><button type="button" className="flex items-center gap-3 px-3 py-2 text-[#3f4850]"><span className="material-symbols-outlined">help</span>Help</button></div>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-24 lg:ml-64 lg:px-12">
        <header className="mb-8 flex flex-col gap-4 border-b border-[#bfc7d2] pb-4 md:flex-row md:items-end md:justify-between"><div><h1 className="text-[2rem] font-semibold tracking-[-0.03em]">Collaboration</h1><p className="mt-2 text-lg text-[#3f4850]">Work together on {tripQuery.data?.title ?? 'this trip'}.</p></div>{canManageMembers ? <button type="button" onClick={() => { setNotice(null); setIsAddOpen(true) }} className="flex items-center justify-center gap-2 rounded-lg bg-[#006194] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#007bb9]"><span className="material-symbols-outlined text-[18px]">person_add</span>Add Member</button> : null}</header>
        {error ? <div className="mb-5"><ErrorAlert message={getApiErrorMessage(error)} /></div> : null}
        {notice ? <div className="mb-5 rounded-xl border border-[#b7e4c7] bg-[#e7f6ec] p-4 text-sm text-[#166534]">{notice}</div> : null}

        {membersQuery.isLoading ? <div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-[#e5eeff]" />)}</div> : members.length === 0 ? <div className="rounded-xl border border-dashed border-[#707881] bg-[#e5eeff] px-6 py-16 text-center"><span className="material-symbols-outlined mb-3 text-5xl text-[#707881]">group</span><h2 className="text-2xl font-semibold">No Members Yet</h2><p className="mt-2 text-[#3f4850]">Invite someone to collaborate on this trip.</p></div> : <section className="rounded-xl border border-[#bfc7d2] bg-white p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-semibold">Members</h2><p className="mt-1 text-sm text-[#3f4850]">{members.length} {members.length === 1 ? 'person' : 'people'} on this trip</p></div>{canManageMembers ? <button type="button" onClick={() => setIsAddOpen(true)} aria-label="Add member" className="rounded-full p-2 text-[#006194] hover:bg-[#eff4ff]"><span className="material-symbols-outlined">person_add</span></button> : null}</div><div className="space-y-4">{members.map((member) => <div key={member.id} className="flex flex-col gap-4 rounded-lg border border-[#bfc7d2] bg-[#f8f9ff] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d3e4fe] font-bold text-[#006194]">{getInitials(member.full_name)}</div><div className="min-w-0"><p className="truncate font-semibold">{member.full_name}</p><p className="truncate text-sm text-[#3f4850]">{member.email}</p></div></div><div className="flex items-center gap-3 sm:justify-end">{member.role === 'owner' ? <span className="rounded-full bg-[#cce5ff] px-3 py-1 text-xs font-semibold text-[#004b73]">Owner</span> : canManageMembers ? <><select aria-label={`Role for ${member.full_name}`} value={member.role} onChange={(event) => updateRoleMutation.mutate({ member, nextRole: event.target.value as Role })} disabled={updateRoleMutation.isPending} className="rounded-lg border-[#bfc7d2] bg-white text-sm text-[#3f4850]"><option value="editor">Editor</option><option value="viewer">Viewer</option></select><button type="button" onClick={() => { setNotice(null); setRemovingMember(member) }} aria-label={`Remove ${member.full_name}`} className="rounded-full p-2 text-[#ba1a1a] hover:bg-[#ffdad6]"><span className="material-symbols-outlined">person_remove</span></button></> : <span className="rounded-full bg-[#d3e4fe] px-3 py-1 text-xs font-semibold text-[#3f4850]">{roleLabel(member.role)}</span>}</div></div>)}</div></section>}
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-[#d3e4fe] bg-[#f8f9ff] px-4 py-2 shadow-lg lg:hidden"><button type="button" onClick={() => navigate('/dashboard')} className="flex flex-col items-center text-[#3f4850]"><span className="material-symbols-outlined">home</span><span className="text-[10px]">Dashboard</span></button><button type="button" className="flex flex-col items-center rounded-full bg-[#dce9ff] px-4 py-1 text-[#004b73]"><span className="material-symbols-outlined">explore</span><span className="text-[10px]">Trips</span></button><button type="button" className="flex flex-col items-center text-[#3f4850]"><span className="material-symbols-outlined">person</span><span className="text-[10px]">Profile</span></button></nav>

      {isAddOpen ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1c30]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsAddOpen(false) }}><form onSubmit={submitAddMember} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-semibold">Add Member</h2><p className="mt-1 text-sm text-[#3f4850]">Invite an existing GlobeTrotter user.</p></div><button type="button" onClick={() => setIsAddOpen(false)} aria-label="Close dialog" className="rounded-full p-2 text-[#3f4850] hover:bg-[#eff4ff]"><span className="material-symbols-outlined">close</span></button></div><div className="grid gap-4"><label className="grid gap-1 text-sm font-semibold">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-lg border-[#bfc7d2]" /></label><label className="grid gap-1 text-sm font-semibold">Role<select value={role} onChange={(event) => setRole(event.target.value as Role)} className="rounded-lg border-[#bfc7d2]"><option value="editor">Editor</option><option value="viewer">Viewer</option></select></label><button disabled={addMemberMutation.isPending} className="mt-2 rounded-lg bg-[#006194] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{addMemberMutation.isPending ? 'Adding...' : 'Add Member'}</button></div></form></div> : null}
      {removingMember ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1c30]/45 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 className="text-xl font-semibold">Remove {removingMember.full_name}?</h2><p className="mt-2 text-sm text-[#3f4850]">They will no longer be able to access this trip.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setRemovingMember(null)} className="rounded-lg border border-[#bfc7d2] px-4 py-2 text-sm font-semibold text-[#3f4850]">Cancel</button><button type="button" onClick={confirmRemove} disabled={removeMemberMutation.isPending} className="rounded-lg bg-[#ba1a1a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{removeMemberMutation.isPending ? 'Removing...' : 'Remove Member'}</button></div></div></div> : null}
    </div>
  )
}

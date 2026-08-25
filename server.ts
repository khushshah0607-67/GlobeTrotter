import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer as createViteServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'globetrotter-jwt-dev-secret-key'

// --- In-Memory Models & Storage ---

interface User {
  id: string
  full_name: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

interface Trip {
  id: string
  owner_id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  cover_image: string | null
  status: string
  created_at: string
  updated_at: string
}

interface TripMember {
  id: string
  trip_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  joined_at: string
}

interface TripCity {
  id: string
  trip_id: string
  city_name: string
  country: string
  latitude: number | null
  longitude: number | null
  arrival_date: string
  departure_date: string
  order_index: number
  notes: string | null
}

interface Activity {
  id: string
  trip_city_id: string
  name: string
  description: string | null
  category: string | null
  date: string
  start_time: string | null
  end_time: string | null
  duration_minutes: number | null
  estimated_cost: number | null
  currency: string | null
  location_name: string | null
  latitude: number | null
  longitude: number | null
  notes: string | null
  order_index: number
  created_at: string
}

interface Budget {
  id: string
  trip_id: string
  total_budget: number
  currency: string
  accommodation_budget: number | null
  transportation_budget: number | null
  food_budget: number | null
  activities_budget: number | null
  miscellaneous_budget: number | null
}

const users = new Map<string, User>()
const trips = new Map<string, Trip>()
const tripMembers = new Map<string, TripMember>() // id -> TripMember
const tripCities = new Map<string, TripCity>() // id -> TripCity
const activities = new Map<string, Activity>() // id -> Activity
const budgets = new Map<string, Budget>() // trip_id -> Budget

// Seed initial demo data
const demoUserId = 'a0000000-0000-0000-0000-000000000001'
const demoCollaboratorId = 'a0000000-0000-0000-0000-000000000002'

const now = new Date().toISOString()
const demoPasswordHash = bcrypt.hashSync('password123', 8)

users.set(demoUserId, {
  id: demoUserId,
  full_name: 'Alex Explorer',
  email: 'traveler@example.com',
  password_hash: demoPasswordHash,
  created_at: now,
  updated_at: now,
})

users.set(demoCollaboratorId, {
  id: demoCollaboratorId,
  full_name: 'Sam Rivera',
  email: 'sam@traveler.com',
  password_hash: demoPasswordHash,
  created_at: now,
  updated_at: now,
})

const demoTripId = 'b0000000-0000-0000-0000-000000000001'
trips.set(demoTripId, {
  id: demoTripId,
  owner_id: demoUserId,
  title: 'European Highlights & Mediterranean Getaway',
  description: 'A two-week voyage connecting Paris, Rome, and Barcelona exploring world-class museums, cuisine, and coastal views.',
  start_date: '2026-09-01',
  end_date: '2026-09-14',
  cover_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  status: 'planning',
  created_at: now,
  updated_at: now,
})

const ownerMemberId = uuidv4()
tripMembers.set(ownerMemberId, {
  id: ownerMemberId,
  trip_id: demoTripId,
  user_id: demoUserId,
  role: 'owner',
  joined_at: now,
})

const collabMemberId = uuidv4()
tripMembers.set(collabMemberId, {
  id: collabMemberId,
  trip_id: demoTripId,
  user_id: demoCollaboratorId,
  role: 'editor',
  joined_at: now,
})

const cityParisId = 'c0000000-0000-0000-0000-000000000001'
const cityRomeId = 'c0000000-0000-0000-0000-000000000002'
const cityBcnId = 'c0000000-0000-0000-0000-000000000003'

tripCities.set(cityParisId, {
  id: cityParisId,
  trip_id: demoTripId,
  city_name: 'Paris',
  country: 'France',
  latitude: 48.8566,
  longitude: 2.3522,
  arrival_date: '2026-09-01',
  departure_date: '2026-09-05',
  order_index: 0,
  notes: 'Stay near the Seine for easy access to central attractions.',
})

tripCities.set(cityRomeId, {
  id: cityRomeId,
  trip_id: demoTripId,
  city_name: 'Rome',
  country: 'Italy',
  latitude: 41.9028,
  longitude: 12.4964,
  arrival_date: '2026-09-05',
  departure_date: '2026-09-09',
  order_index: 1,
  notes: 'Pre-book skip-the-line tickets for the Colosseum and Vatican.',
})

tripCities.set(cityBcnId, {
  id: cityBcnId,
  trip_id: demoTripId,
  city_name: 'Barcelona',
  country: 'Spain',
  latitude: 41.3879,
  longitude: 2.1699,
  arrival_date: '2026-09-09',
  departure_date: '2026-09-14',
  order_index: 2,
  notes: 'Enjoy evening tapas and beach walks in Barceloneta.',
})

const act1 = uuidv4()
activities.set(act1, {
  id: act1,
  trip_city_id: cityParisId,
  name: 'Louvre Museum Guided Tour',
  description: 'Masterpieces tour including the Mona Lisa and Venus de Milo.',
  category: 'Sightseeing',
  date: '2026-09-02',
  start_time: '10:00',
  end_time: '13:00',
  duration_minutes: 180,
  estimated_cost: 45,
  currency: 'USD',
  location_name: 'Musée du Louvre',
  latitude: null,
  longitude: null,
  notes: 'Meeting at the glass pyramid.',
  order_index: 0,
  created_at: now,
})

const act2 = uuidv4()
activities.set(act2, {
  id: act2,
  trip_city_id: cityParisId,
  name: 'Eiffel Tower Sunset & Summit',
  description: 'Evening elevator ascent to the summit.',
  category: 'Sightseeing',
  date: '2026-09-03',
  start_time: '18:30',
  end_time: '21:00',
  duration_minutes: 150,
  estimated_cost: 35,
  currency: 'USD',
  location_name: 'Champ de Mars',
  latitude: null,
  longitude: null,
  notes: null,
  order_index: 1,
  created_at: now,
})

const act3 = uuidv4()
activities.set(act3, {
  id: act3,
  trip_city_id: cityRomeId,
  name: 'Colosseum & Roman Forum Tour',
  description: 'Ancient Rome historical walking tour with archaeologist guide.',
  category: 'History',
  date: '2026-09-06',
  start_time: '09:00',
  end_time: '12:30',
  duration_minutes: 210,
  estimated_cost: 48,
  currency: 'USD',
  location_name: 'Piazza del Colosseo',
  latitude: null,
  longitude: null,
  notes: null,
  order_index: 0,
  created_at: now,
})

const act4 = uuidv4()
activities.set(act4, {
  id: act4,
  trip_city_id: cityRomeId,
  name: 'Trastevere Culinary Walk',
  description: 'Sample authentic Roman pasta, street food, and gelato.',
  category: 'Food',
  date: '2026-09-07',
  start_time: '18:00',
  end_time: '21:30',
  duration_minutes: 210,
  estimated_cost: 65,
  currency: 'USD',
  location_name: 'Trastevere',
  latitude: null,
  longitude: null,
  notes: null,
  order_index: 1,
  created_at: now,
})

const act5 = uuidv4()
activities.set(act5, {
  id: act5,
  trip_city_id: cityBcnId,
  name: 'Sagrada Família Audio Tour',
  description: "Antoni Gaudí's unfinished basilica and tower views.",
  category: 'Sightseeing',
  date: '2026-09-10',
  start_time: '11:00',
  end_time: '13:00',
  duration_minutes: 120,
  estimated_cost: 32,
  currency: 'USD',
  location_name: 'C/ de Mallorca, 401',
  latitude: null,
  longitude: null,
  notes: null,
  order_index: 0,
  created_at: now,
})

const act6 = uuidv4()
activities.set(act6, {
  id: act6,
  trip_city_id: cityBcnId,
  name: 'Flamenco Show at Tablao Cordobes',
  description: 'Traditional Spanish flamenco with tapas and sangria.',
  category: 'Entertainment',
  date: '2026-09-11',
  start_time: '20:00',
  end_time: '22:30',
  duration_minutes: 150,
  estimated_cost: 55,
  currency: 'USD',
  location_name: 'La Rambla, 35',
  latitude: null,
  longitude: null,
  notes: null,
  order_index: 1,
  created_at: now,
})

const budgetId = uuidv4()
budgets.set(demoTripId, {
  id: budgetId,
  trip_id: demoTripId,
  total_budget: 3500,
  currency: 'USD',
  accommodation_budget: 1400,
  transportation_budget: 800,
  food_budget: 700,
  activities_budget: 400,
  miscellaneous_budget: 200,
})

// --- Helper Functions ---

function toUserResponse(user: User) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

function getMembership(tripId: string, userId: string): TripMember | undefined {
  for (const member of tripMembers.values()) {
    if (member.trip_id === tripId && member.user_id === userId) {
      return member
    }
  }
  return undefined
}

function isTripAccessible(tripId: string, userId: string): boolean {
  const trip = trips.get(tripId)
  if (!trip) return false
  if (trip.owner_id === userId) return true
  const member = getMembership(tripId, userId)
  return member !== undefined
}

function canWriteTrip(tripId: string, userId: string): boolean {
  const trip = trips.get(tripId)
  if (!trip) return false
  if (trip.owner_id === userId) return true
  const member = getMembership(tripId, userId)
  return member?.role === 'editor'
}

function getFullTripResponse(trip: Trip) {
  const citiesList: any[] = []
  for (const city of tripCities.values()) {
    if (city.trip_id === trip.id) {
      const cityActivities: Activity[] = []
      for (const act of activities.values()) {
        if (act.trip_city_id === city.id) {
          cityActivities.push(act)
        }
      }
      cityActivities.sort((a, b) => a.order_index - b.order_index)
      citiesList.push({
        ...city,
        activities: cityActivities,
      })
    }
  }
  citiesList.sort((a, b) => a.order_index - b.order_index)

  return {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    start_date: trip.start_date,
    end_date: trip.end_date,
    cover_image: trip.cover_image,
    status: trip.status,
    created_at: trip.created_at,
    updated_at: trip.updated_at,
    cities: citiesList,
  }
}

function getTripSpendingSummary(tripId: string) {
  const trip = trips.get(tripId)
  if (!trip) return null

  let citiesCount = 0
  let activitiesCount = 0
  let totalActivityCost = 0

  for (const city of tripCities.values()) {
    if (city.trip_id === tripId) {
      citiesCount++
      for (const act of activities.values()) {
        if (act.trip_city_id === city.id) {
          activitiesCount++
          if (act.estimated_cost != null) {
            totalActivityCost += Number(act.estimated_cost)
          }
        }
      }
    }
  }

  const budget = budgets.get(tripId) || null
  const totalBudget = budget ? Number(budget.total_budget) : null
  const remainingBudget = totalBudget != null ? totalBudget - totalActivityCost : null

  return {
    trip: {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      start_date: trip.start_date,
      end_date: trip.end_date,
      cover_image: trip.cover_image,
      status: trip.status,
      created_at: trip.created_at,
      updated_at: trip.updated_at,
    },
    cities_count: citiesCount,
    activities_count: activitiesCount,
    total_activity_cost: totalActivityCost,
    budget: budget,
    remaining_budget: remainingBudget,
  }
}

// --- Express App Setup ---

async function startServer() {
  const app = express()
  const PORT = 3000

  app.use(cors())
  app.use(express.json())

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'globetrotter-api' })
  })

  // Auth Middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ detail: 'Not authenticated' })
      return
    }

    const token = authHeader.slice(7)
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string }
      const user = users.get(decoded.sub)
      if (!user) {
        res.status(401).json({ detail: 'User not found' })
        return
      }
      ;(req as any).user = user
      next()
    } catch {
      res.status(401).json({ detail: 'Invalid or expired token' })
    }
  }

  // --- Auth Routes ---

  app.post('/api/v1/auth/register', (req: Request, res: Response) => {
    const { full_name, email, password } = req.body
    if (!full_name || !email || !password) {
      res.status(422).json({ detail: 'Missing required fields' })
      return
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    for (const u of users.values()) {
      if (u.email.toLowerCase() === normalizedEmail) {
        res.status(409).json({ detail: 'A user with this email already exists' })
        return
      }
    }

    const id = uuidv4()
    const timestamp = new Date().toISOString()
    const password_hash = bcrypt.hashSync(password, 8)

    const newUser: User = {
      id,
      full_name: full_name.trim(),
      email: normalizedEmail,
      password_hash,
      created_at: timestamp,
      updated_at: timestamp,
    }

    users.set(id, newUser)
    res.status(201).json(toUserResponse(newUser))
  })

  app.post('/api/v1/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(422).json({ detail: 'Email and password required' })
      return
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    let foundUser: User | undefined
    for (const u of users.values()) {
      if (u.email.toLowerCase() === normalizedEmail) {
        foundUser = u
        break
      }
    }

    if (!foundUser || !bcrypt.compareSync(password, foundUser.password_hash)) {
      res.status(401).json({ detail: 'Invalid email or password' })
      return
    }

    const token = jwt.sign({ sub: foundUser.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ access_token: token, token_type: 'bearer' })
  })

  app.get('/api/v1/auth/me', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    res.json(toUserResponse(currentUser))
  })

  // --- Trips Routes ---

  app.get('/api/v1/trips', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const userTrips: any[] = []

    for (const trip of trips.values()) {
      if (isTripAccessible(trip.id, currentUser.id)) {
        userTrips.push({
          id: trip.id,
          title: trip.title,
          description: trip.description,
          start_date: trip.start_date,
          end_date: trip.end_date,
          cover_image: trip.cover_image,
          status: trip.status,
          created_at: trip.created_at,
          updated_at: trip.updated_at,
        })
      }
    }

    userTrips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    res.json(userTrips)
  })

  app.post('/api/v1/trips', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { title, description, start_date, end_date, cover_image, status } = req.body

    if (!title || !start_date || !end_date) {
      res.status(422).json({ detail: 'Title, start_date, and end_date are required' })
      return
    }

    if (new Date(start_date) > new Date(end_date)) {
      res.status(422).json({ detail: 'start_date must be on or before end_date' })
      return
    }

    const id = uuidv4()
    const timestamp = new Date().toISOString()

    const newTrip: Trip = {
      id,
      owner_id: currentUser.id,
      title: title.trim(),
      description: description || null,
      start_date,
      end_date,
      cover_image: cover_image || null,
      status: status || 'planning',
      created_at: timestamp,
      updated_at: timestamp,
    }

    trips.set(id, newTrip)

    const membershipId = uuidv4()
    tripMembers.set(membershipId, {
      id: membershipId,
      trip_id: id,
      user_id: currentUser.id,
      role: 'owner',
      joined_at: timestamp,
    })

    res.status(201).json(getFullTripResponse(newTrip))
  })

  app.get('/api/v1/trips/:tripId', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId } = req.params
    const trip = trips.get(tripId)

    if (!trip || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    res.json(getFullTripResponse(trip))
  })

  app.patch('/api/v1/trips/:tripId', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId } = req.params
    const trip = trips.get(tripId)

    if (!trip || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    if (!canWriteTrip(tripId, currentUser.id)) {
      res.status(403).json({ detail: 'You do not have permission to update this trip' })
      return
    }

    const { title, description, start_date, end_date, cover_image, status } = req.body

    const nextStartDate = start_date ?? trip.start_date
    const nextEndDate = end_date ?? trip.end_date

    if (new Date(nextStartDate) > new Date(nextEndDate)) {
      res.status(422).json({ detail: 'start_date must be on or before end_date' })
      return
    }

    if (title !== undefined) trip.title = title.trim()
    if (description !== undefined) trip.description = description
    if (start_date !== undefined) trip.start_date = start_date
    if (end_date !== undefined) trip.end_date = end_date
    if (cover_image !== undefined) trip.cover_image = cover_image
    if (status !== undefined) trip.status = status
    trip.updated_at = new Date().toISOString()

    res.json(getFullTripResponse(trip))
  })

  app.delete('/api/v1/trips/:tripId', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId } = req.params
    const trip = trips.get(tripId)

    if (!trip || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    if (trip.owner_id !== currentUser.id) {
      res.status(403).json({ detail: 'Only the trip owner can delete this trip' })
      return
    }

    // Delete members
    for (const [id, m] of tripMembers.entries()) {
      if (m.trip_id === tripId) tripMembers.delete(id)
    }

    // Delete cities & activities
    for (const [cId, c] of tripCities.entries()) {
      if (c.trip_id === tripId) {
        for (const [aId, a] of activities.entries()) {
          if (a.trip_city_id === cId) activities.delete(aId)
        }
        tripCities.delete(cId)
      }
    }

    // Delete budget
    budgets.delete(tripId)

    // Delete trip
    trips.delete(tripId)

    res.status(204).send()
  })

  // --- Trip Cities Routes ---

  app.get('/api/v1/trips/:tripId/cities', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId } = req.params

    if (!isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    const list: any[] = []
    for (const city of tripCities.values()) {
      if (city.trip_id === tripId) {
        const cityActivities: Activity[] = []
        for (const act of activities.values()) {
          if (act.trip_city_id === city.id) {
            cityActivities.push(act)
          }
        }
        cityActivities.sort((a, b) => a.order_index - b.order_index)
        list.push({ ...city, activities: cityActivities })
      }
    }

    list.sort((a, b) => a.order_index - b.order_index)
    res.json(list)
  })

  app.post('/api/v1/trips/:tripId/cities', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId } = req.params

    if (!isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    if (!canWriteTrip(tripId, currentUser.id)) {
      res.status(403).json({ detail: 'You do not have permission to modify this trip' })
      return
    }

    const { city_name, country, latitude, longitude, arrival_date, departure_date, order_index, notes } = req.body

    if (!city_name || !country || !arrival_date || !departure_date) {
      res.status(422).json({ detail: 'Missing required city fields' })
      return
    }

    if (new Date(arrival_date) > new Date(departure_date)) {
      res.status(422).json({ detail: 'arrival_date must be on or before departure_date' })
      return
    }

    const id = uuidv4()
    const newCity: TripCity = {
      id,
      trip_id: tripId,
      city_name: city_name.trim(),
      country: country.trim(),
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      arrival_date,
      departure_date,
      order_index: order_index != null ? Number(order_index) : 0,
      notes: notes || null,
    }

    tripCities.set(id, newCity)
    res.status(201).json({ ...newCity, activities: [] })
  })

  app.patch('/api/v1/trips/:tripId/cities/:cityId', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId, cityId } = req.params
    const city = tripCities.get(cityId)

    if (!city || city.trip_id !== tripId || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'City not found' })
      return
    }

    if (!canWriteTrip(tripId, currentUser.id)) {
      res.status(403).json({ detail: 'You do not have permission to modify this city' })
      return
    }

    const { city_name, country, latitude, longitude, arrival_date, departure_date, order_index, notes } = req.body

    const nextArr = arrival_date ?? city.arrival_date
    const nextDep = departure_date ?? city.departure_date
    if (new Date(nextArr) > new Date(nextDep)) {
      res.status(422).json({ detail: 'arrival_date must be on or before departure_date' })
      return
    }

    if (city_name !== undefined) city.city_name = city_name.trim()
    if (country !== undefined) city.country = country.trim()
    if (latitude !== undefined) city.latitude = latitude
    if (longitude !== undefined) city.longitude = longitude
    if (arrival_date !== undefined) city.arrival_date = arrival_date
    if (departure_date !== undefined) city.departure_date = departure_date
    if (order_index !== undefined) city.order_index = Number(order_index)
    if (notes !== undefined) city.notes = notes

    const cityActivities: Activity[] = []
    for (const act of activities.values()) {
      if (act.trip_city_id === city.id) {
        cityActivities.push(act)
      }
    }
    cityActivities.sort((a, b) => a.order_index - b.order_index)

    res.json({ ...city, activities: cityActivities })
  })

  app.delete('/api/v1/trips/:tripId/cities/:cityId', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId, cityId } = req.params
    const city = tripCities.get(cityId)

    if (!city || city.trip_id !== tripId || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'City not found' })
      return
    }

    if (!canWriteTrip(tripId, currentUser.id)) {
      res.status(403).json({ detail: 'You do not have permission to modify this city' })
      return
    }

    for (const [aId, a] of activities.entries()) {
      if (a.trip_city_id === cityId) activities.delete(aId)
    }
    tripCities.delete(cityId)

    res.status(204).send()
  })

  // --- Activities Routes ---

  app.get('/api/v1/trips/:tripId/cities/:cityId/activities', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId, cityId } = req.params
    const city = tripCities.get(cityId)

    if (!city || city.trip_id !== tripId || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'City not found' })
      return
    }

    const list: Activity[] = []
    for (const act of activities.values()) {
      if (act.trip_city_id === cityId) list.push(act)
    }
    list.sort((a, b) => a.order_index - b.order_index)
    res.json(list)
  })

  app.post('/api/v1/trips/:tripId/cities/:cityId/activities', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId, cityId } = req.params
    const city = tripCities.get(cityId)

    if (!city || city.trip_id !== tripId || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'City not found' })
      return
    }

    if (!canWriteTrip(tripId, currentUser.id)) {
      res.status(403).json({ detail: 'You do not have permission to modify this activity' })
      return
    }

    const {
      name,
      description,
      category,
      date,
      start_time,
      end_time,
      duration_minutes,
      estimated_cost,
      currency,
      location_name,
      latitude,
      longitude,
      notes,
      order_index,
    } = req.body

    if (!name || !date) {
      res.status(422).json({ detail: 'Activity name and date are required' })
      return
    }

    const id = uuidv4()
    const newAct: Activity = {
      id,
      trip_city_id: cityId,
      name: name.trim(),
      description: description || null,
      category: category || null,
      date,
      start_time: start_time || null,
      end_time: end_time || null,
      duration_minutes: duration_minutes != null ? Number(duration_minutes) : null,
      estimated_cost: estimated_cost != null ? Number(estimated_cost) : null,
      currency: currency || null,
      location_name: location_name || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      notes: notes || null,
      order_index: order_index != null ? Number(order_index) : 0,
      created_at: new Date().toISOString(),
    }

    activities.set(id, newAct)
    res.status(201).json(newAct)
  })

  app.patch('/api/v1/trips/:tripId/cities/:cityId/activities/:activityId', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId, cityId, activityId } = req.params
    const act = activities.get(activityId)

    if (!act || act.trip_city_id !== cityId || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Activity not found' })
      return
    }

    if (!canWriteTrip(tripId, currentUser.id)) {
      res.status(403).json({ detail: 'You do not have permission to modify this activity' })
      return
    }

    const {
      name,
      description,
      category,
      date,
      start_time,
      end_time,
      duration_minutes,
      estimated_cost,
      currency,
      location_name,
      latitude,
      longitude,
      notes,
      order_index,
    } = req.body

    if (name !== undefined) act.name = name.trim()
    if (description !== undefined) act.description = description
    if (category !== undefined) act.category = category
    if (date !== undefined) act.date = date
    if (start_time !== undefined) act.start_time = start_time
    if (end_time !== undefined) act.end_time = end_time
    if (duration_minutes !== undefined) act.duration_minutes = duration_minutes != null ? Number(duration_minutes) : null
    if (estimated_cost !== undefined) act.estimated_cost = estimated_cost != null ? Number(estimated_cost) : null
    if (currency !== undefined) act.currency = currency
    if (location_name !== undefined) act.location_name = location_name
    if (latitude !== undefined) act.latitude = latitude
    if (longitude !== undefined) act.longitude = longitude
    if (notes !== undefined) act.notes = notes
    if (order_index !== undefined) act.order_index = Number(order_index)

    res.json(act)
  })

  app.delete('/api/v1/trips/:tripId/cities/:cityId/activities/:activityId', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId, cityId, activityId } = req.params
    const act = activities.get(activityId)

    if (!act || act.trip_city_id !== cityId || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Activity not found' })
      return
    }

    if (!canWriteTrip(tripId, currentUser.id)) {
      res.status(403).json({ detail: 'You do not have permission to modify this activity' })
      return
    }

    activities.delete(activityId)
    res.status(204).send()
  })

  // --- Members Routes ---

  app.get('/api/v1/trips/:tripId/members', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId } = req.params

    if (!isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    const list: any[] = []
    for (const member of tripMembers.values()) {
      if (member.trip_id === tripId) {
        const u = users.get(member.user_id)
        list.push({
          id: member.id,
          trip_id: member.trip_id,
          user_id: member.user_id,
          role: member.role,
          joined_at: member.joined_at,
          full_name: u?.full_name || 'Unknown User',
          email: u?.email || '',
        })
      }
    }

    res.json(list)
  })

  app.post('/api/v1/trips/:tripId/members', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId } = req.params
    const trip = trips.get(tripId)

    if (!trip || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    if (trip.owner_id !== currentUser.id) {
      res.status(403).json({ detail: 'Only the trip owner can manage members' })
      return
    }

    const { email, role } = req.body
    if (!email || !role) {
      res.status(422).json({ detail: 'Email and role are required' })
      return
    }

    if (role === 'owner') {
      res.status(422).json({ detail: 'The owner role cannot be assigned through member management' })
      return
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    let targetUser: User | undefined
    for (const u of users.values()) {
      if (u.email.toLowerCase() === normalizedEmail) {
        targetUser = u
        break
      }
    }

    if (!targetUser) {
      res.status(404).json({ detail: 'Trip member not found' })
      return
    }

    if (targetUser.id === currentUser.id || getMembership(tripId, targetUser.id)) {
      res.status(409).json({ detail: 'User is already a member of this trip' })
      return
    }

    const id = uuidv4()
    const newMember: TripMember = {
      id,
      trip_id: tripId,
      user_id: targetUser.id,
      role: role as 'editor' | 'viewer',
      joined_at: new Date().toISOString(),
    }

    tripMembers.set(id, newMember)

    res.status(201).json({
      id: newMember.id,
      trip_id: newMember.trip_id,
      user_id: newMember.user_id,
      role: newMember.role,
      joined_at: newMember.joined_at,
      full_name: targetUser.full_name,
      email: targetUser.email,
    })
  })

  app.patch('/api/v1/trips/:tripId/members/:userId', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId, userId } = req.params
    const trip = trips.get(tripId)

    if (!trip || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    if (trip.owner_id !== currentUser.id) {
      res.status(403).json({ detail: 'Only the trip owner can manage members' })
      return
    }

    const { role } = req.body
    if (role === 'owner' || userId === trip.owner_id) {
      res.status(422).json({ detail: 'The trip owner cannot be changed through member management' })
      return
    }

    const member = getMembership(tripId, userId)
    if (!member) {
      res.status(404).json({ detail: 'Trip member not found' })
      return
    }

    member.role = role
    const u = users.get(userId)

    res.json({
      id: member.id,
      trip_id: member.trip_id,
      user_id: member.user_id,
      role: member.role,
      joined_at: member.joined_at,
      full_name: u?.full_name || 'Unknown User',
      email: u?.email || '',
    })
  })

  app.delete('/api/v1/trips/:tripId/members/:userId', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId, userId } = req.params
    const trip = trips.get(tripId)

    if (!trip || !isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    if (trip.owner_id !== currentUser.id) {
      res.status(403).json({ detail: 'Only the trip owner can manage members' })
      return
    }

    if (userId === trip.owner_id) {
      res.status(422).json({ detail: 'The trip owner cannot be removed through member management' })
      return
    }

    const member = getMembership(tripId, userId)
    if (!member) {
      res.status(404).json({ detail: 'Trip member not found' })
      return
    }

    tripMembers.delete(member.id)
    res.status(204).send()
  })

  // --- Budget Routes ---

  app.get('/api/v1/trips/:tripId/budget', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId } = req.params

    if (!isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Budget not found' })
      return
    }

    const budget = budgets.get(tripId)
    if (!budget) {
      res.status(404).json({ detail: 'Budget not found' })
      return
    }

    res.json(budget)
  })

  app.post('/api/v1/trips/:tripId/budget', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId } = req.params

    if (!isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    if (!canWriteTrip(tripId, currentUser.id)) {
      res.status(403).json({ detail: 'You do not have permission to modify this budget' })
      return
    }

    if (budgets.has(tripId)) {
      res.status(409).json({ detail: 'This trip already has a budget' })
      return
    }

    const {
      total_budget,
      currency,
      accommodation_budget,
      transportation_budget,
      food_budget,
      activities_budget,
      miscellaneous_budget,
    } = req.body

    if (total_budget == null || !currency) {
      res.status(422).json({ detail: 'Total budget and currency are required' })
      return
    }

    const id = uuidv4()
    const newBudget: Budget = {
      id,
      trip_id: tripId,
      total_budget: Number(total_budget),
      currency: currency.trim(),
      accommodation_budget: accommodation_budget != null ? Number(accommodation_budget) : null,
      transportation_budget: transportation_budget != null ? Number(transportation_budget) : null,
      food_budget: food_budget != null ? Number(food_budget) : null,
      activities_budget: activities_budget != null ? Number(activities_budget) : null,
      miscellaneous_budget: miscellaneous_budget != null ? Number(miscellaneous_budget) : null,
    }

    budgets.set(tripId, newBudget)
    res.status(201).json(newBudget)
  })

  app.patch('/api/v1/trips/:tripId/budget', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId } = req.params

    if (!isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Budget not found' })
      return
    }

    if (!canWriteTrip(tripId, currentUser.id)) {
      res.status(403).json({ detail: 'You do not have permission to modify this budget' })
      return
    }

    const budget = budgets.get(tripId)
    if (!budget) {
      res.status(404).json({ detail: 'Budget not found' })
      return
    }

    const {
      total_budget,
      currency,
      accommodation_budget,
      transportation_budget,
      food_budget,
      activities_budget,
      miscellaneous_budget,
    } = req.body

    if (total_budget !== undefined) budget.total_budget = Number(total_budget)
    if (currency !== undefined) budget.currency = currency.trim()
    if (accommodation_budget !== undefined) budget.accommodation_budget = accommodation_budget != null ? Number(accommodation_budget) : null
    if (transportation_budget !== undefined) budget.transportation_budget = transportation_budget != null ? Number(transportation_budget) : null
    if (food_budget !== undefined) budget.food_budget = food_budget != null ? Number(food_budget) : null
    if (activities_budget !== undefined) budget.activities_budget = activities_budget != null ? Number(activities_budget) : null
    if (miscellaneous_budget !== undefined) budget.miscellaneous_budget = miscellaneous_budget != null ? Number(miscellaneous_budget) : null

    res.json(budget)
  })

  app.get('/api/v1/trips/:tripId/summary', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as User
    const { tripId } = req.params

    if (!isTripAccessible(tripId, currentUser.id)) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    const summary = getTripSpendingSummary(tripId)
    if (!summary) {
      res.status(404).json({ detail: 'Trip not found' })
      return
    }

    res.json(summary)
  })

  // --- Frontend Vite Integration ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.use((req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GlobeTrotter running on http://0.0.0.0:${PORT}`)
  })
}

startServer()

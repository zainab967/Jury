import { createContext, useContext, useState, ReactNode } from 'react'

type UserRole = 'jury' | 'employee'

interface User {
  id: string
  name: string
  role: UserRole
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  isJury: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const isJury = user?.role === 'jury'

  return (
    <UserContext.Provider value={{ user, setUser, isJury }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
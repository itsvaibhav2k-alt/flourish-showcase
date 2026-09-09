'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface AnimatedGreetingProps {
  userName: string
  date: string
}

// Get first name from full name or email
function getFirstName(name: string): string {
  // If it's an email, extract the part before @
  if (name.includes('@')) {
    name = name.split('@')[0]
  }
  // Get first word/name
  return name.split(' ')[0]
}

// Generate a fun, personalized greeting based on time and day
function generateGreeting(firstName: string): { greeting: string; emoji?: string } {
  const hour = new Date().getHours()
  const dayOfWeek = new Date().getDay()

  // Monday greetings
  if (dayOfWeek === 1) {
    const mondayGreetings = [
      { greeting: `Happy Monday, ${firstName}!`, emoji: undefined },
      { greeting: `${firstName} conquers Monday`, emoji: undefined },
      { greeting: `New week, let's go ${firstName}!`, emoji: undefined },
    ]
    return mondayGreetings[Math.floor(Math.random() * mondayGreetings.length)]
  }

  // Friday greetings
  if (dayOfWeek === 5) {
    const fridayGreetings = [
      { greeting: `Happy Friday, ${firstName}!`, emoji: undefined },
      { greeting: `TGIF, ${firstName}!`, emoji: undefined },
      { greeting: `Friday vibes, ${firstName}`, emoji: undefined },
    ]
    return fridayGreetings[Math.floor(Math.random() * fridayGreetings.length)]
  }

  // Morning greetings (5am - 12pm)
  if (hour >= 5 && hour < 12) {
    const morningGreetings = [
      { greeting: `Good morning, ${firstName}!`, emoji: undefined },
      { greeting: `Rise and shine, ${firstName}`, emoji: undefined },
      { greeting: `${firstName} starts fresh`, emoji: undefined },
      { greeting: `Morning, ${firstName}!`, emoji: undefined },
      { greeting: `${firstName} is here!`, emoji: undefined },
      { greeting: `Ready to make a difference, ${firstName}?`, emoji: undefined },
    ]
    return morningGreetings[Math.floor(Math.random() * morningGreetings.length)]
  }

  // Afternoon greetings (12pm - 5pm)
  if (hour >= 12 && hour < 17) {
    const afternoonGreetings = [
      { greeting: `Good afternoon, ${firstName}!`, emoji: undefined },
      { greeting: `${firstName} returns!`, emoji: undefined },
      { greeting: `Hey there, ${firstName}`, emoji: undefined },
      { greeting: `Welcome back, ${firstName}!`, emoji: undefined },
      { greeting: `${firstName} is back`, emoji: undefined },
      { greeting: `Afternoon check-in, ${firstName}`, emoji: undefined },
    ]
    return afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)]
  }

  // Evening greetings (5pm - 9pm)
  if (hour >= 17 && hour < 21) {
    const eveningGreetings = [
      { greeting: `Good evening, ${firstName}!`, emoji: undefined },
      { greeting: `Evening, ${firstName}`, emoji: undefined },
      { greeting: `${firstName} checks in`, emoji: undefined },
      { greeting: `Wrapping up, ${firstName}?`, emoji: undefined },
      { greeting: `Still going, ${firstName}!`, emoji: undefined },
    ]
    return eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)]
  }

  // Late night greetings (9pm - 5am)
  const lateGreetings = [
    { greeting: `Burning the midnight oil, ${firstName}?`, emoji: undefined },
    { greeting: `Night owl ${firstName}`, emoji: undefined },
    { greeting: `Late night hustle, ${firstName}`, emoji: undefined },
    { greeting: `${firstName} works late`, emoji: undefined },
  ]
  return lateGreetings[Math.floor(Math.random() * lateGreetings.length)]
}

export function AnimatedGreeting({ userName, date }: AnimatedGreetingProps) {
  const firstName = getFirstName(userName)
  const [greeting, setGreeting] = useState<{ greeting: string; emoji?: string }>({
    greeting: `Welcome back, ${firstName}!`
  })

  useEffect(() => {
    // Generate dynamic greeting only on client after mount
    setGreeting(generateGreeting(firstName))
  }, [firstName])

  return (
    <div className="flex items-center gap-4">
      <h1
        className="text-2xl font-semibold text-neutral-900"
        suppressHydrationWarning
      >
        {greeting.greeting}
        {greeting.emoji && <span className="ml-2">{greeting.emoji}</span>}
      </h1>
      <span className="text-neutral-300">·</span>
      <p className="text-neutral-500 text-sm flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        <span suppressHydrationWarning>{date}</span>
      </p>
    </div>
  )
}

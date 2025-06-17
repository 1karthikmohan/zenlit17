import { supabase } from './supabase'

export interface UsernameCheckResult {
  available: boolean
  error?: string
  suggestions?: string[]
}

// Check if username is available
export const checkUsernameAvailability = async (username: string): Promise<UsernameCheckResult> => {
  try {
    // Validate username format first
    if (!username || username.length < 3) {
      return { available: false, error: 'Username must be at least 3 characters long' }
    }

    if (username.length > 30) {
      return { available: false, error: 'Username must be 30 characters or less' }
    }

    // Check format: only lowercase letters, numbers, dots, underscores
    const usernameRegex = /^[a-z0-9._]+$/
    if (!usernameRegex.test(username)) {
      return { available: false, error: 'Username can only contain lowercase letters, numbers, dots, and underscores' }
    }

    // Check if username starts or ends with special characters
    if (username.startsWith('.') || username.startsWith('_') || 
        username.endsWith('.') || username.endsWith('_')) {
      return { available: false, error: 'Username cannot start or end with dots or underscores' }
    }

    // Check for consecutive special characters
    if (username.includes('..') || username.includes('__') || 
        username.includes('._') || username.includes('_.')) {
      return { available: false, error: 'Username cannot have consecutive special characters' }
    }

    // Check if username is available in database
    const { data: existingUser, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Username check error:', error)
      return { available: false, error: 'Unable to check username availability' }
    }

    if (existingUser) {
      // Username is taken, generate suggestions
      const suggestions = await generateUsernameSuggestions(username)
      return { 
        available: false, 
        error: 'Username is already taken',
        suggestions 
      }
    }

    return { available: true }
  } catch (error) {
    console.error('Username availability check failed:', error)
    return { available: false, error: 'Unable to check username availability' }
  }
}

// Generate username suggestions when the desired one is taken
const generateUsernameSuggestions = async (baseUsername: string): Promise<string[]> => {
  const suggestions: string[] = []
  
  try {
    // Remove any existing numbers from the end
    const cleanBase = baseUsername.replace(/\d+$/, '')
    
    // Generate numbered variations
    for (let i = 1; i <= 5; i++) {
      const suggestion = `${cleanBase}${i}`
      if (suggestion.length <= 30) {
        suggestions.push(suggestion)
      }
    }

    // Generate variations with common suffixes
    const suffixes = ['_', '.me', '.dev', '.user', '123']
    for (const suffix of suffixes) {
      const suggestion = `${cleanBase}${suffix}`
      if (suggestion.length <= 30) {
        suggestions.push(suggestion)
      }
    }

    // Check which suggestions are actually available
    const availableSuggestions: string[] = []
    
    for (const suggestion of suggestions) {
      const { data: existingUser, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', suggestion)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        continue // Skip this suggestion if we can't check it
      }

      if (!existingUser) {
        availableSuggestions.push(suggestion)
        if (availableSuggestions.length >= 3) break // Limit to 3 suggestions
      }
    }

    return availableSuggestions
  } catch (error) {
    console.error('Error generating username suggestions:', error)
    return []
  }
}

// Reserve a username (called during profile setup)
export const reserveUsername = async (username: string, userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Double-check availability before reserving
    const availability = await checkUsernameAvailability(username)
    if (!availability.available) {
      return { success: false, error: availability.error }
    }

    // Update the user's profile with the username
    const { error } = await supabase
      .from('profiles')
      .update({ 
        username: username.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Username reservation error:', error)
      
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        return { success: false, error: 'Username was just taken by another user' }
      }
      
      return { success: false, error: 'Failed to reserve username' }
    }

    return { success: true }
  } catch (error) {
    console.error('Username reservation failed:', error)
    return { success: false, error: 'Failed to reserve username' }
  }
}

// Validate username format (for client-side validation)
export const validateUsernameFormat = (username: string): { valid: boolean; error?: string } => {
  if (!username) {
    return { valid: false, error: 'Username is required' }
  }

  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' }
  }

  if (username.length > 30) {
    return { valid: false, error: 'Username must be 30 characters or less' }
  }

  const usernameRegex = /^[a-z0-9._]+$/
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Username can only contain lowercase letters, numbers, dots, and underscores' }
  }

  if (username.startsWith('.') || username.startsWith('_') || 
      username.endsWith('.') || username.endsWith('_')) {
    return { valid: false, error: 'Username cannot start or end with dots or underscores' }
  }

  if (username.includes('..') || username.includes('__') || 
      username.includes('._') || username.includes('_.')) {
    return { valid: false, error: 'Username cannot have consecutive special characters' }
  }

  return { valid: true }
}
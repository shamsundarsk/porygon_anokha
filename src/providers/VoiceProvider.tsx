import React, { createContext, useContext, useState, useEffect } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { useSocket } from './SocketProvider'
import toast from 'react-hot-toast'

interface VoiceContextType {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  isSupported: boolean
  processVoiceCommand: (command: string) => void
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

export const useVoice = () => {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sendVoiceCommand } = useSocket()
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  useEffect(() => {
    // Process voice command when transcript changes and we're not listening
    if (transcript && !listening && transcript.length > 0) {
      processVoiceCommand(transcript)
    }
  }, [transcript, listening])

  const startListening = () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error('Voice recognition not supported in this browser')
      return
    }

    resetTranscript()
    SpeechRecognition.startListening({
      continuous: false,
      language: 'en-IN' // Indian English
    })
  }

  const stopListening = () => {
    SpeechRecognition.stopListening()
  }

  const processVoiceCommand = async (command: string) => {
    if (isProcessing) return

    setIsProcessing(true)
    
    try {
      const lowerCommand = command.toLowerCase().trim()
      
      // Define voice command patterns
      const commands = {
        // Navigation commands
        'go to dashboard': () => window.location.href = '/customer/dashboard',
        'open dashboard': () => window.location.href = '/customer/dashboard',
        'show my deliveries': () => window.location.href = '/customer/dashboard',
        
        // Delivery commands
        'create new delivery': () => window.location.href = '/customer/new-delivery',
        'book delivery': () => window.location.href = '/customer/new-delivery',
        'new delivery': () => window.location.href = '/customer/new-delivery',
        
        // Driver commands
        'go online': () => handleDriverStatusChange(true),
        'go offline': () => handleDriverStatusChange(false),
        'start navigation': () => window.location.href = '/driver/map',
        'open map': () => window.location.href = '/driver/map',
        
        // Status commands
        'accept delivery': () => handleAcceptDelivery(),
        'mark picked up': () => handleStatusUpdate('PICKED_UP'),
        'mark delivered': () => handleStatusUpdate('DELIVERED'),
        
        // General commands
        'help': () => showVoiceHelp(),
        'what can i say': () => showVoiceHelp()
      }

      // Check for exact matches first
      if (commands[lowerCommand]) {
        commands[lowerCommand]()
        toast.success(`Command executed: ${command}`)
      } else {
        // Check for partial matches
        let commandFound = false
        
        for (const [pattern, action] of Object.entries(commands)) {
          if (lowerCommand.includes(pattern) || pattern.includes(lowerCommand)) {
            action()
            toast.success(`Command executed: ${pattern}`)
            commandFound = true
            break
          }
        }
        
        if (!commandFound) {
          // Send to server for advanced processing
          sendVoiceCommand(command)
          toast.info(`Processing: "${command}"`)
        }
      }
    } catch (error) {
      console.error('Voice command processing error:', error)
      toast.error('Failed to process voice command')
    } finally {
      setIsProcessing(false)
      resetTranscript()
    }
  }

  const handleDriverStatusChange = (online: boolean) => {
    // This would typically call an API to update driver status
    toast.success(`Driver status: ${online ? 'Online' : 'Offline'}`)
  }

  const handleAcceptDelivery = () => {
    // This would typically accept the current available delivery
    toast.success('Delivery accepted')
  }

  const handleStatusUpdate = (status: string) => {
    // This would typically update the current delivery status
    toast.success(`Status updated to: ${status}`)
  }

  const showVoiceHelp = () => {
    const helpCommands = [
      'Navigation: "Go to dashboard", "Open map"',
      'Delivery: "Create new delivery", "Accept delivery"',
      'Status: "Go online", "Mark picked up", "Mark delivered"',
      'Help: "Help", "What can I say"'
    ]
    
    toast.success(
      <div>
        <strong>Voice Commands:</strong>
        <ul className="mt-2 text-sm">
          {helpCommands.map((cmd, index) => (
            <li key={index} className="mb-1">• {cmd}</li>
          ))}
        </ul>
      </div>,
      { duration: 8000 }
    )
  }

  return (
    <VoiceContext.Provider value={{
      isListening: listening,
      transcript,
      startListening,
      stopListening,
      resetTranscript,
      isSupported: browserSupportsSpeechRecognition,
      processVoiceCommand
    }}>
      {children}
    </VoiceContext.Provider>
  )
}
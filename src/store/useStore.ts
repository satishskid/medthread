import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getPatient, addChatMessage, getChatMessages, savePatient } from '../db/queries';
import { Patient as FHIRPatient } from '../fhir/resources';

export interface User {
  id: string;
  name: string;
  role: 'doctor' | 'nurse' | 'specialist' | 'patient' | 'admin';
  department?: string;
}

export interface Message {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  messageType: 'text' | 'image' | 'document' | 'task';
  attachments?: string[];
  fhirResources?: string[];
  reasoning?: string;
}

export interface Task {
  id: string;
  threadId: string;
  title: string;
  description: string;
  urgency: 'emergent' | 'urgent' | 'routine';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Patient {
  id: string;
  threadId: string;
  name: string;
  demographics: any;
  messages: Message[];
  tasks: Task[];
  fhirResources: any[];
  status: 'active' | 'discharged' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReasoningLog {
  id: string;
  messageId: string;
  reasoning: string;
  evidence: string[];
  confidence: number;
  timestamp: Date;
}

interface StoreState {
  // User state
  currentUser: User | null;
  currentRole: string;
  
  // Patient state
  activePatientId: string | null;
  patients: Record<string, Patient>;
  
  // Chat state
  messages: Message[];
  isTyping: boolean;
  
  // Task state
  tasks: Task[];
  
  // FHIR state
  fhirResources: any[];
  
  // AI state
  reasoningLog: ReasoningLog[];
  aiConfig: any;
  
  // Actions
  setCurrentUser: (user: User) => void;
  setActivePatient: (id: string | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  setTyping: (isTyping: boolean) => void;
  addReasoningLog: (log: Omit<ReasoningLog, 'id' | 'timestamp'>) => void;
  clearCurrentThread: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  currentUser: null,
  currentRole: 'doctor',
  activePatientId: null,
  patients: {},
  messages: [],
  isTyping: false,
  tasks: [],
  fhirResources: [],
  reasoningLog: [],
  aiConfig: null,

  // Actions
  setCurrentUser: (user) => {
    set({ currentUser: user, currentRole: user.role });
  },

  setActivePatient: async (id) => {
    set({ activePatientId: id });
    if (id) {
      try {
        // Load patient from database
        const patient = await getPatient(id);
        if (patient) {
          // Load chat messages from database
          const messages = await getChatMessages(id);
          set({ 
            messages: messages.map(msg => ({
              id: msg.id,
              threadId: id,
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              messageType: 'text' as const,
              attachments: msg.attachments ? JSON.parse(msg.attachments) : undefined,
              fhirResources: msg.fhirResources ? JSON.parse(msg.fhirResources) : undefined
            })),
            tasks: [],
            fhirResources: []
          });
        }
      } catch (error) {
        console.error('Failed to load patient data:', error);
      }
    }
  },

  addMessage: async (messageData) => {
    const { activePatientId } = get();
    const newMessage: Message = {
      ...messageData,
      id: uuidv4(),
      timestamp: new Date()
    };
    
    // Add to messages array
    set(state => ({ messages: [...state.messages, newMessage] }));
    
    // Save to database if active patient
    if (activePatientId) {
      try {
        await addChatMessage({
          id: newMessage.id,
          patientId: activePatientId,
          role: newMessage.role,
          content: newMessage.content,
          timestamp: newMessage.timestamp.toISOString(),
          attachments: newMessage.attachments ? JSON.stringify(newMessage.attachments) : null,
          fhirResources: newMessage.fhirResources ? JSON.stringify(newMessage.fhirResources) : null
        });
      } catch (error) {
        console.error('Failed to save message to database:', error);
      }
    }
    
    // Extract and add tasks if AI message contains actionable items
    if (newMessage.role === 'assistant') {
      const tasks = extractTasks(newMessage.content, newMessage.threadId);
      tasks.forEach(task => get().addTask(task));
      
      // Add reasoning log
      const reasoning = generateReasoning(newMessage, get().messages.slice(-5));
      get().addReasoningLog({
        messageId: newMessage.id,
        reasoning: reasoning.text,
        evidence: reasoning.evidence,
        confidence: reasoning.confidence
      });
    }
  },

  updateMessage: (id, updates) => {
    const { messages } = get();
    const updatedMessages = messages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    );
    set({ messages: updatedMessages });
  },

  addTask: (taskData) => {
    const { tasks } = get();
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date()
    };
    
    set({ tasks: [...tasks, newTask] });
  },

  updateTask: (taskId, updates) => {
    const { tasks } = get();
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    set({ tasks: updatedTasks });
  },

  addPatient: (patientData) => {
    const { patients } = get();
    const newPatient: Patient = {
      ...patientData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    set({
      patients: {
        ...patients,
        [newPatient.id]: newPatient
      }
    });
    
    return newPatient.id;
  },

  updatePatient: (id, updates) => {
    const { patients } = get();
    if (patients[id]) {
      set({
        patients: {
          ...patients,
          [id]: {
            ...patients[id],
            ...updates,
            updatedAt: new Date()
          }
        }
      });
    }
  },

  setTyping: (isTyping) => {
    set({ isTyping });
  },

  addReasoningLog: (logData) => {
    const { reasoningLog } = get();
    const newLog: ReasoningLog = {
      ...logData,
      id: uuidv4(),
      timestamp: new Date()
    };
    
    set({ reasoningLog: [...reasoningLog, newLog] });
  },

  clearCurrentThread: () => {
    set({
      activePatientId: null,
      messages: [],
      tasks: []
    });
  }
}));

// Helper functions
function generateReasoning(message: Message, context: Message[]) {
  // This would integrate with the AI reasoning engine
  return {
    text: `AI reasoning for: ${message.content.substring(0, 50)}...`,
    evidence: ['Clinical guidelines', 'Patient history'],
    confidence: 0.85
  };
}

function extractTasks(content: string, threadId: string): Omit<Task, 'id' | 'createdAt'>[] {
  const tasks: Omit<Task, 'id' | 'createdAt'>[] = [];
  
  // Simple task extraction - in real implementation, this would be more sophisticated
  const taskPatterns = [
    /order\s+([^.]+)/gi,
    /check\s+([^.]+)/gi,
    /monitor\s+([^.]+)/gi,
    /follow[- ]?up\s+([^.]+)/gi
  ];
  
  taskPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      tasks.push({
        threadId,
        title: match[1].trim(),
        description: `AI suggested: ${match[0]}`,
        urgency: 'routine',
        status: 'pending'
      });
    }
  });
  
  return tasks;
}
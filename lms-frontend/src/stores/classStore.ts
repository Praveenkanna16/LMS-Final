import { create } from 'zustand';
import type { User } from '@/types';

interface ClassStore {
  currentClass: Class | null;
  participants: User[];
  whiteboardData: any;
  chatMessages: ChatMessage[];
  joinClass: (classData: Class) => void;
  leaveClass: () => void;
  addParticipant: (user: User) => void;
  removeParticipant: (userId: string) => void;
  sendMessage: (message: ChatMessage) => void;
  updateWhiteboard: (data: any) => void;
}

interface Class {
  id: string;
  name: string;
  teacherId: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  timestamp: Date;
}

export const useClassStore = create<ClassStore>(set => ({
  currentClass: null,
  participants: [],
  whiteboardData: null,
  chatMessages: [],
  joinClass: classData => {
    set({ currentClass: classData, participants: [], chatMessages: [] });
  },
  leaveClass: () => {
    set({ currentClass: null, participants: [], chatMessages: [] });
  },
  addParticipant: user => {
    set(state => ({
      participants: [...state.participants, user],
    }));
  },
  removeParticipant: userId => {
    set(state => ({
      participants: state.participants.filter(p => p.id !== userId),
    }));
  },
  sendMessage: message => {
    set(state => ({
      chatMessages: [...state.chatMessages, message],
    }));
  },
  updateWhiteboard: data => {
    set({ whiteboardData: data });
  },
}));

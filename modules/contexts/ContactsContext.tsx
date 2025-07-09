import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  category: 'family' | 'medical' | 'emergency' | 'friends';
  description?: string;
  videoCallEnabled: boolean;
  voiceMessage?: string;
  photo?: string;
}

interface ContactsContextType {
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

interface ContactsProviderProps {
  children: ReactNode;
}

export function ContactsProvider({ children }: ContactsProviderProps) {
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Sarah',
      relationship: 'Daughter',
      phone: '+1 (555) 123-4567',
      category: 'family',
      description: 'Your loving daughter who visits every week',
      videoCallEnabled: true,
      photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: '2',
      name: 'Dr. Johnson',
      relationship: 'Doctor',
      phone: '+1 (555) 987-6543',
      category: 'medical',
      description: 'Your primary care physician',
      videoCallEnabled: false,
      photo: 'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: '3',
      name: 'Leo',
      relationship: 'Grandson',
      phone: '+1 (555) 456-7890',
      category: 'family',
      description: 'Your wonderful grandson who loves to call',
      videoCallEnabled: true,
      photo: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: '4',
      name: 'Emergency Services',
      relationship: 'Emergency',
      phone: '911',
      category: 'emergency',
      description: 'For any emergency situation',
      videoCallEnabled: false,
    },
    {
      id: '5',
      name: 'Mary',
      relationship: 'Best Friend',
      phone: '+1 (555) 234-5678',
      category: 'friends',
      description: 'Your dear friend from the neighborhood',
      videoCallEnabled: true,
      photo: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: '6',
      name: 'Home Care Service',
      relationship: 'Care Provider',
      phone: '+1 (555) 345-6789',
      category: 'medical',
      description: 'Your home care assistance team',
      videoCallEnabled: false,
    },
  ]);

  const addContact = (newContact: Omit<Contact, 'id'>) => {
    const id = Date.now().toString();
    setContacts(prev => [...prev, { ...newContact, id }]);
  };

  const updateContact = (id: string, updatedContact: Partial<Contact>) => {
    setContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, ...updatedContact } : contact
    ));
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== id));
  };

  return (
    <ContactsContext.Provider value={{ 
      contacts, 
      addContact, 
      updateContact, 
      deleteContact 
    }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
}
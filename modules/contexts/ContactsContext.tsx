import React, { createContext, useContext, useState, ReactNode } from 'react';
import contactsData from '../../config/contacts.json';

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
  const [contacts, setContacts] = useState<Contact[]>(contactsData as Contact[]);

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
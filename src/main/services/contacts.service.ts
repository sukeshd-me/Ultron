// src/main/services/contacts.service.ts — Contact Resolver
export interface Contact {
  id: string
  name: string
  aliases: string[]
  phone: string
  email?: string
}

export class ContactsService {
  private contacts: Contact[] = [
    {
      id: 'c1',
      name: 'Sukesh',
      aliases: ['sukesh', 'boss', 'master', 'me'],
      phone: '+1234567890',
      email: 'sukesh@ultron.ai'
    }
  ]

  resolveContact(query: string): Contact | null {
    const q = query.toLowerCase().trim()
    return (
      this.contacts.find(
        (c) =>
          c.name.toLowerCase() === q ||
          c.aliases.some((a) => a.toLowerCase() === q) ||
          c.name.toLowerCase().includes(q)
      ) || null
    )
  }

  getAll(): Contact[] {
    return this.contacts
  }
}

export const contactsService = new ContactsService()
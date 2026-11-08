export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  category: 'general' | 'support' | 'feedback' | 'complaint' | 'partnership' | 'other';
}

export interface ContactResponse {
  message: string;
  contactId: string;
}

export interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  category: string;
  status: 'pending' | 'read' | 'replied' | 'resolved' | 'spam';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  category?: string;
}
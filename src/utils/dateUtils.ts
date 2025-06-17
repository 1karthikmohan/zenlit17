import { format } from 'date-fns';

// Helper function to safely format dates
export const formatPostDate = (dateValue: any): string => {
  try {
    // Handle different date formats and fallbacks
    let date: Date;
    
    if (!dateValue) {
      date = new Date();
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date();
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    
    return format(date, 'MMM d, yyyy • h:mm a');
  } catch (error) {
    console.warn('Date formatting error:', error);
    return format(new Date(), 'MMM d, yyyy • h:mm a');
  }
};

export const formatMessageTime = (dateValue: any): string => {
  try {
    let date: Date;
    
    if (!dateValue) {
      date = new Date();
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date();
    }
    
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    
    return format(date, 'HH:mm');
  } catch (error) {
    console.warn('Date formatting error:', error);
    return format(new Date(), 'HH:mm');
  }
};
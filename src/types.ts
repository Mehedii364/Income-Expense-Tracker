export type TransactionType = 'income' | 'expense';

export type Category = 
  | 'বেতন' 
  | 'ফ্রিল্যান্সিং' 
  | 'বিনিয়োগ' 
  | 'খাবার' 
  | 'যাতায়াত' 
  | 'মোবাইল/ইন্টারনেট'
  | 'বাজার'
  | 'ভাড়া' 
  | 'ইউটিলিটি' 
  | 'বিনোদন' 
  | 'কেনাকাটা' 
  | 'স্বাস্থ্য' 
  | 'অন্যান্য';

export interface Transaction {
  id: string;
  text: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
}

export const CATEGORIES: Record<TransactionType, Category[]> = {
  income: ['বেতন', 'ফ্রিল্যান্সিং', 'বিনিয়োগ', 'অন্যান্য'],
  expense: ['খাবার', 'যাতায়াত', 'মোবাইল/ইন্টারনেট', 'বাজার', 'ভাড়া', 'ইউটিলিটি', 'বিনোদন', 'কেনাকাটা', 'স্বাস্থ্য', 'অন্যান্য']
};

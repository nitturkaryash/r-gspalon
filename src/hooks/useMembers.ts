import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { Member } from '../types/member';

// Initial demo data for members
const initialMembers: Member[] = [
  {
    id: '1',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '123-456-7890',
    balance: 50000,
    joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    membershipType: 'premium'
  },
  {
    id: '2',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '987-654-3210',
    balance: 75000,
    joinDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    membershipType: 'regular'
  }
];

// Load members from localStorage
const loadMembersFromStorage = (): Member[] => {
  try {
    const storedMembers = localStorage.getItem('members');
    
    if (storedMembers) {
      return JSON.parse(storedMembers);
    }
    
    // If no members found in localStorage, save the initial ones
    localStorage.setItem('members', JSON.stringify(initialMembers.map(member => ({
      ...member,
      joinDate: typeof member.joinDate === 'string' ? member.joinDate : member.joinDate.toISOString()
    }))));
    return initialMembers;
  } catch (error) {
    console.error('Error loading members from localStorage:', error);
    return initialMembers;
  }
};

// Save members to localStorage
const saveMembersToStorage = (members: Member[]) => {
  try {
    // Convert Date objects to ISO strings for storage
    const membersToSave = members.map(member => ({
      ...member,
      joinDate: typeof member.joinDate === 'string' ? member.joinDate : member.joinDate.toISOString()
    }));
    localStorage.setItem('members', JSON.stringify(membersToSave));
  } catch (error) {
    console.error('Error saving members to localStorage:', error);
  }
};

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load members on init
  useEffect(() => {
    const loadedMembers = loadMembersFromStorage();
    setMembers(loadedMembers);
    setIsLoading(false);
  }, []);

  // Create a new member
  const createMember = (newMember: Omit<Member, 'id' | 'joinDate'>) => {
    const member: Member = {
      id: uuidv4(),
      joinDate: new Date(),
      ...newMember
    };

    const updatedMembers = [...members, member];
    setMembers(updatedMembers);
    saveMembersToStorage(updatedMembers);
    toast.success('Member added successfully');
    return member;
  };

  // Update a member
  const updateMember = (memberId: string | number, updates: Partial<Omit<Member, 'id'>>) => {
    const index = members.findIndex(m => m.id === memberId);
    
    if (index === -1) {
      toast.error('Member not found');
      return null;
    }
    
    const updatedMembers = [...members];
    const updatedMember = {
      ...updatedMembers[index],
      ...updates,
      joinDate: typeof updatedMembers[index].joinDate === 'string' ? updatedMembers[index].joinDate : updatedMembers[index].joinDate.toISOString()
    };

    updatedMembers[index] = updatedMember;
    setMembers(updatedMembers);
    saveMembersToStorage(updatedMembers);
    toast.success('Member updated successfully');
    return updatedMember;
  };

  // Top up a member's balance
  const topUpMember = (memberId: string | number, amount: number) => {
    const index = members.findIndex(m => m.id === memberId);
    
    if (index === -1) {
      toast.error('Member not found');
      return;
    }
    
    const updatedMembers = [...members];
    const member = { ...updatedMembers[index] };
    member.balance += amount;
    
    updatedMembers[index] = member;
    setMembers(updatedMembers);
    saveMembersToStorage(updatedMembers);
    toast.success(`Balance updated: ₹${member.balance.toFixed(2)}`);
  };

  // Delete a member
  const deleteMember = (memberId: string | number) => {
    const updatedMembers = members.filter(m => m.id !== memberId);
    setMembers(updatedMembers);
    saveMembersToStorage(updatedMembers);
    toast.success('Member deleted successfully');
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return {
    members,
    isLoading,
    createMember,
    updateMember,
    topUpMember,
    deleteMember,
    formatCurrency
  };
} 
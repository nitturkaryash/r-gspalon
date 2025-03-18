import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
// Initial demo data for members
const initialMembers = [
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
// Load members from localStorage or use initial ones
const loadMembersFromStorage = () => {
    try {
        const savedMembers = localStorage.getItem('members');
        if (savedMembers) {
            const parsedMembers = JSON.parse(savedMembers);
            // Convert joinDate strings back to Date objects
            return parsedMembers.map((member) => ({
                ...member,
                joinDate: new Date(member.joinDate)
            }));
        }
        // If no members found in localStorage, save the initial ones
        localStorage.setItem('members', JSON.stringify(initialMembers.map(member => ({
            ...member,
            joinDate: member.joinDate.toISOString()
        }))));
        return initialMembers;
    }
    catch (error) {
        console.error('Error loading members from localStorage:', error);
        return initialMembers;
    }
};
// Save members to localStorage
const saveMembersToStorage = (members) => {
    try {
        // Convert Date objects to ISO strings for storage
        const membersToSave = members.map(member => ({
            ...member,
            joinDate: member.joinDate.toISOString()
        }));
        localStorage.setItem('members', JSON.stringify(membersToSave));
    }
    catch (error) {
        console.error('Error saving members to localStorage:', error);
    }
};
export function useMembers() {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // Load members on init
    useEffect(() => {
        const loadedMembers = loadMembersFromStorage();
        setMembers(loadedMembers);
        setIsLoading(false);
    }, []);
    // Create a new member
    const createMember = (newMember) => {
        const member = {
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
    const updateMember = (memberId, updates) => {
        const index = members.findIndex(m => m.id === memberId);
        if (index === -1) {
            toast.error('Member not found');
            return null;
        }
        const updatedMembers = [...members];
        updatedMembers[index] = {
            ...updatedMembers[index],
            ...updates
        };
        setMembers(updatedMembers);
        saveMembersToStorage(updatedMembers);
        toast.success('Member updated successfully');
        return updatedMembers[index];
    };
    // Top up a member's account
    const topUpMember = (memberId, amount) => {
        const index = members.findIndex(m => m.id === memberId);
        if (index === -1) {
            toast.error('Member not found');
            return null;
        }
        const updatedMembers = [...members];
        updatedMembers[index] = {
            ...updatedMembers[index],
            balance: updatedMembers[index].balance + amount
        };
        setMembers(updatedMembers);
        saveMembersToStorage(updatedMembers);
        toast.success(`Account topped up with ${formatCurrency(amount)}`);
        return updatedMembers[index];
    };
    // Delete a member
    const deleteMember = (memberId) => {
        const updatedMembers = members.filter(m => m.id !== memberId);
        setMembers(updatedMembers);
        saveMembersToStorage(updatedMembers);
        toast.success('Member deleted successfully');
    };
    // Format currency for display
    const formatCurrency = (amount) => {
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

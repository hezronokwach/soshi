// FILE: src/components/groups/GroupMembers.js

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { groups, users } from '../../lib/api';
import { getImageUrl } from '../../utils/image';

export default function GroupMembers({ params, group, isCreator, pendingMembers, acceptedMembers, fetchGroup }) {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [inviting, setInviting] = useState(false);
    // Handle member requests
    const handleMemberRequest = async (userId, action) => {
        try {
            console.log('Updating member with status:', action);
            await groups.updateMember(params.id, userId, action);
            fetchGroup(); // Refresh to get updated member list
        } catch (error) {
            console.error('Error managing member:', error);
            alert(error.message || 'Failed to update member status');
        }
    };

    // Remove member
    const handleRemoveMember = async (userId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            await groups.removeMember(params.id, userId);
            fetchGroup(); // Refresh to get updated member list
        } catch (error) {
            console.error('Error removing member:', error);
            alert(error.message || 'Failed to remove member');
        }
    };

    // Search users for invitation
    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            const allUsers = await users.getAllUsers();
            const memberIds = [...acceptedMembers, ...pendingMembers].map(m => m.user_id);
            const filtered = allUsers.filter(user => 
                !memberIds.includes(user.id) &&
                (`${user.first_name} ${user.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
                 user.email.toLowerCase().includes(query.toLowerCase()))
            );
            setSearchResults(filtered.slice(0, 10));
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    // Invite user to group
    const handleInviteUser = async (userId) => {
        setInviting(true);
        try {
            await groups.inviteToGroup(params.id, userId);
            setShowInviteModal(false);
            setSearchQuery('');
            setSearchResults([]);
            alert('Invitation sent successfully!');
            fetchGroup();
        } catch (error) {
            console.error('Error inviting user:', error);
            alert(error.message || 'Failed to send invitation');
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Pending Requests (Only visible to group creator) */}
            {isCreator && pendingMembers.length > 0 && (
                <Card variant="glassmorphism" className="p-6">
                    <h3 className="font-display font-semibold text-lg mb-4 text-orange-400">
                        Pending Join Requests ({pendingMembers.length})
                    </h3>
                    <div className="space-y-3">
                        {pendingMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-orange-900/20 rounded-lg border border-orange-400/30">
                                <div className="flex items-center gap-3">
                                    {member.user?.avatar || member.avatar ? (
                                        <img src={getImageUrl(member.user?.avatar || member.avatar)} alt={member.user?.first_name} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">
                                                {(member.user?.first_name || member.first_name)?.[0]}{(member.user?.last_name || member.last_name)?.[0]}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <Link
                                            href={`/profile/${member.user?.id || member.user_id || member.id}`}
                                            className="font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                        >
                                            {member.user?.first_name || member.first_name} {member.user?.last_name || member.last_name}
                                        </Link>
                                        <p className="text-sm text-blue-300">Wants to join this group</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => handleMemberRequest(member.user_id, 'accepted')}
                                        className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-all duration-normal"
                                    >
                                        Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRemoveMember(member.user_id)} // Handle decline as member removal
                                        className="text-red-400 border-red-400 hover:bg-red-900/20 hover:scale-105 transition-all duration-normal"
                                    >
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Accepted Members */}
            <Card variant="glassmorphism" className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-lg text-text-primary">
                        Members ({acceptedMembers.length})
                    </h3>
                    {(isCreator || acceptedMembers.some(m => m.user_id === group.creator_id)) && (
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setShowInviteModal(true)}
                        >
                            Invite Members
                        </Button>
                    )}
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {acceptedMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {member.user?.avatar || member.avatar ? (
                                        <img src={getImageUrl(member.user?.avatar || member.avatar)} alt={member.user?.first_name} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">
                                                {((member.user?.first_name || member.first_name || '').charAt(0) +
                                                  (member.user?.last_name || member.last_name || '').charAt(0)).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    {/* Online indicator - randomly show some as online for demo */}
                                    {Math.random() > 0.5 && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/profile/${member.user?.id || member.user_id || member.id}`}
                                            className="font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                        >
                                            {member.user?.first_name || member.first_name} {member.user?.last_name || member.last_name}
                                        </Link>
                                        {Math.random() > 0.5 && (
                                            <span className="text-xs text-green-400 font-medium">• Online</span>
                                        )}
                                    </div>
                                    {member.user_id === group.creator_id && (
                                        <p className="text-xs text-blue-300 font-medium">Creator</p>
                                    )}
                                </div>
                            </div>
                            {isCreator && member.user_id !== group.creator_id && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    className="text-red-400 border-red-400 hover:bg-red-900/20"
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card variant="glassmorphism" className="w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display font-semibold text-lg text-text-primary">
                                Invite Members
                            </h3>
                            <Button
                                size="sm"
                                variant="tertiary"
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                            >
                                ×
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <Input
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                }}
                                variant="filled"
                            />
                            {searchResults.length > 0 && (
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {searchResults.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-surface/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {user.avatar ? (
                                                    <img src={getImageUrl(user.avatar)} alt={user.first_name} className="w-8 h-8 rounded-full" />
                                                ) : (
                                                    <div className="w-8 h-8 bg-primary-gradient rounded-full flex items-center justify-center">
                                                        <span className="text-white text-xs font-medium">
                                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-text-primary text-sm">
                                                        {user.first_name} {user.last_name}
                                                    </p>
                                                    <p className="text-xs text-text-secondary">{user.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => handleInviteUser(user.id)}
                                                disabled={inviting}
                                            >
                                                {inviting ? 'Inviting...' : 'Invite'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searchQuery && searchResults.length === 0 && (
                                <p className="text-text-secondary text-sm text-center py-4">
                                    No users found matching your search.
                                </p>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
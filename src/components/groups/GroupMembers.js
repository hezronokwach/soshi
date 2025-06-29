// FILE: src/components/groups/GroupMembers.js

'use client';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { groups } from '@/lib/api';

export default function GroupMembers({ params, group, isCreator, pendingMembers, acceptedMembers, fetchGroup }) {
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

    return (
        <div className="space-y-6">
            {/* Pending Requests (Only visible to group creator) */}
            {isCreator && pendingMembers.length > 0 && (
                <Card className="p-4">
                    <h3 className="font-semibold text-lg mb-4 text-orange-400">
                        Pending Join Requests ({pendingMembers.length})
                    </h3>
                    <div className="space-y-3">
                        {pendingMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-orange-900/20 rounded-lg border border-orange-400/30">
                                <div className="flex items-center gap-3">
                                    {member.user?.avatar || member.avatar ? (
                                        <img src={member.user?.avatar || member.avatar} alt={member.user?.first_name} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
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
                                        onClick={() => handleMemberRequest(member.user_id, 'accepted')}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRemoveMember(member.user_id)} // Handle decline as member removal
                                        className="text-red-400 border-red-400 hover:bg-red-900/20"
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
            <Card className="p-4">
                <h3 className="font-semibold text-lg mb-4 text-white">
                    Members ({acceptedMembers.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {acceptedMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {member.user?.avatar || member.avatar ? (
                                        <img src={member.user?.avatar || member.avatar} alt={member.user?.first_name} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                                            {((member.user?.first_name || member.first_name || '').charAt(0) +
                                              (member.user?.last_name || member.last_name || '').charAt(0)).toUpperCase()}
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
        </div>
    );
}
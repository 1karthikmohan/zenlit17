import { useState, useEffect, useMemo } from 'react';
import { ChatList } from '../components/messaging/ChatList';
import { ChatWindow } from '../components/messaging/ChatWindow';
import { User, Message } from '../types';
import { generateMessages } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  selectedUser?: User | null;
  onClearSelectedUser?: () => void;
  onViewProfile?: (user: User) => void;
}

export const MessagesScreen: React.FC<Props> = ({ 
  selectedUser: initialSelectedUser, 
  onClearSelectedUser,
  onViewProfile
}) => {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(initialSelectedUser || undefined);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobile] = useState(window.innerWidth < 768);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (initialSelectedUser) {
      setSelectedUser(initialSelectedUser);
      if (initialSelectedUser) {
        handleSelectUser(initialSelectedUser);
      }
    }
  }, [initialSelectedUser]);

  // Load users for search
  const loadUsers = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) return;

      setCurrentUserId(currentUser.id);

      // Get users who have completed their profiles for messaging
      // Include username in the select query
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*') // This includes username
        .neq('id', currentUser.id) // Exclude current user
        .not('name', 'is', null)
        .not('bio', 'is', null)
        .limit(50); // Increased limit for better search results

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      // Transform database profiles to User type
      const transformedUsers: User[] = (profiles || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        username: profile.username, // Include username
        dpUrl: profile.profile_photo_url || `https://i.pravatar.cc/300?img=${profile.id}`,
        bio: profile.bio,
        gender: profile.gender,
        age: profile.date_of_birth ? 
          new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : 25,
        distance: Math.floor(Math.random() * 50) + 1,
        interests: profile.interests || [],
        links: {
          Twitter: profile.twitter_url || '#',
          Instagram: profile.instagram_url || '#',
          LinkedIn: profile.linked_in_url || '#',
        },
        instagramUrl: profile.instagram_url,
        instagramVerified: profile.instagram_verified,
        facebookUrl: profile.facebook_url,
        facebookVerified: profile.facebook_verified,
        linkedInUrl: profile.linked_in_url,
        linkedInVerified: profile.linked_in_verified,
        twitterUrl: profile.twitter_url,
        twitterVerified: profile.twitter_verified,
        googleUrl: profile.google_url,
        googleVerified: profile.google_verified,
      }));

      setAllUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Find or create a chat between two users
  const findOrCreateChat = async (userId1: string, userId2: string) => {
    const { data: chat, error } = await supabase
      .from('chats')
      .select('*')
      .or(`(user1_id.eq.${userId1}, user2_id.eq.${userId2}), (user1_id.eq.${userId2}, user2_id.eq.${userId1})`);

    if (error) {
      console.error('Error finding or creating chat:', error);
      return null;
    }

    if (chat.length > 0) {
      return chat[0];
    }

    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert([{ user1_id: userId1, user2_id: userId2 }])
      .select();

    if (createError || !Array.isArray(newChat) || newChat.length === 0) {
      console.error('Error creating chat:', createError);
      return null;
    }

    return newChat[0];
  };

  // Fetch messages from Supabase
  const fetchMessages = async (chatId: string) => {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return messages;
  };

  // Send message to the DB
  const sendMessage = async (chatId: string, message: string) => {
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert([{ chat_id: chatId, message }]);

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return newMessage[0];
  };

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allUsers;
    }

    const query = searchQuery.toLowerCase().trim();
    return allUsers.filter(user => {
      // Search by name
      const nameMatch = user.name.toLowerCase().includes(query);
      // Search by username (if available)
      const usernameMatch = user.username?.toLowerCase().includes(query);
      // Search by username without @ symbol
      const usernameWithoutAt = query.startsWith('@') ? query.slice(1) : query;
      const usernameExactMatch = user.username?.toLowerCase().includes(usernameWithoutAt);
      return nameMatch || usernameMatch || usernameExactMatch;
    });
  }, [allUsers, searchQuery]);

  const handleBackToList = () => {
    setSelectedUser(undefined);
    if (onClearSelectedUser) {
      onClearSelectedUser();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleSelectUser = async (user: User) => {
    const chat = await findOrCreateChat(currentUserId, user.id);
    if (chat) {
      setCurrentChatId(chat.id);
      const messages = await fetchMessages(chat.id);
      setMessages(messages);
      setSelectedUser(user);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (currentChatId) {
      const newMessage = await sendMessage(currentChatId, message);
      if (newMessage) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black flex">
      {/* Mobile: Show either chat list or chat window */}
      {isMobile ? (
        <>
          {!selectedUser ? (
            <div className="w-full flex flex-col">
              {/* Header with Search */}
              <div className="px-4 py-3 bg-black border-b border-gray-800 flex-shrink-0">
                <h2 className="text-xl font-bold text-white mb-3">Messages</h2>
                
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by name or @username"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                    </button>
                  )}
                </div>
                
                {/* Search Results Count */}
                {searchQuery && (
                  <p className="text-sm text-gray-400 mt-2">
                    {filteredUsers.length === 0 
                      ? 'No users found' 
                      : `${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''} found`
                    }
                  </p>
                )}
              </div>
              
              {/* Chat List */}
              <div className="flex-1 overflow-hidden">
                <ChatList
                  users={filteredUsers}
                  messages={allMessages}
                  selectedUser={selectedUser}
                  onSelectUser={handleSelectUser}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          ) : (
            <div className="w-full">
              <ChatWindow
                user={selectedUser}
                messages={selectedUserMessages}
                onSendMessage={handleSendMessage}
                currentUserId={currentUserId}
                onBack={handleBackToList}
                onViewProfile={onViewProfile}
              />
            </div>
          )}
        </>
      ) : (
        /* Desktop: Show both panels */
        <>
          <div className="w-80 border-r border-gray-800 flex flex-col">
            {/* Header with Search */}
            <div className="px-4 py-3 bg-black border-b border-gray-800 flex-shrink-0">
              <h2 className="text-xl font-bold text-white mb-3">Messages</h2>
              
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search by name or @username"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                  </button>
                )}
              </div>
              
              {/* Search Results Count */}
              {searchQuery && (
                <p className="text-sm text-gray-400 mt-2">
                  {filteredUsers.length === 0 
                    ? 'No users found' 
                    : `${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''} found`
                  }
                </p>
              )}
            </div>
            
            {/* Chat List */}
            <div className="flex-1 overflow-hidden">
              <ChatList
                users={filteredUsers}
                messages={allMessages}
                selectedUser={selectedUser}
                onSelectUser={handleSelectUser}
                searchQuery={searchQuery}
              />
            </div>
          </div>
          
          <div className="flex-1">
            {selectedUser ? (
              <ChatWindow
                user={selectedUser}
                messages={selectedUserMessages}
                onSendMessage={handleSendMessage}
                currentUserId={currentUserId}
                onBack={isMobile ? handleBackToList : undefined}
                onViewProfile={onViewProfile}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-400">Select a conversation to start messaging</p>
                  {searchQuery && (
                    <p className="text-gray-500 text-sm mt-2">
                      Or search for someone to start a new conversation
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface Chat {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  lastMessageAt: string;
}

export default function Chat() {
  const { user, isAuthenticated } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["/api/chats"],
    enabled: isAuthenticated,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/chats/${selectedChatId}/messages`],
    enabled: !!selectedChatId,
  });

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Authenticate WebSocket connection
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        ws.send(JSON.stringify({
          type: 'auth',
          token: refreshToken
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'auth') {
          if (data.status === 'success') {
            console.log('WebSocket authenticated');
          } else {
            console.error('WebSocket authentication failed');
          }
        }
        
        if (data.type === 'new_message') {
          // Refresh messages for the active chat
          if (data.chatId === selectedChatId) {
            queryClient.invalidateQueries({ queryKey: [`/api/chats/${selectedChatId}/messages`] });
          }
          // Refresh chat list
          queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
        }
        
        if (data.type === 'message_sent') {
          // Message sent successfully
          setNewMessage("");
          queryClient.invalidateQueries({ queryKey: [`/api/chats/${selectedChatId}/messages`] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [isAuthenticated, user, selectedChatId, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChatId || !socket) return;

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'chat_message',
        chatId: selectedChatId,
        content: newMessage.trim()
      }));
    } else {
      toast({
        title: "Connection Error",
        description: "Unable to send message. Please refresh and try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const selectedChat = chats?.find((chat: Chat) => chat.id === selectedChatId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">Chat with buyers and sellers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {chatsLoading ? (
                <div className="space-y-4 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center p-3 animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : chats?.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {chats.map((chat: Chat) => {
                    const isSelected = selectedChatId === chat.id;
                    const otherUserId = chat.buyerId === user?.id ? chat.sellerId : chat.buyerId;
                    
                    return (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-r-2 border-primary' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <Avatar className="w-12 h-12 mr-3">
                            <AvatarFallback>
                              <User className="w-6 h-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {chat.buyerId === user?.id ? 'Seller' : 'Buyer'}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">
                              {chat.lastMessageAt 
                                ? `Last message: ${new Date(chat.lastMessageAt).toLocaleDateString()}`
                                : 'No messages yet'
                              }
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge variant="secondary" className="text-xs">
                              {chat.buyerId === user?.id ? 'Buying' : 'Selling'}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
                  <p className="text-gray-600">Start browsing products to begin conversations with sellers</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedChatId ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center">
                    <Avatar className="w-10 h-10 mr-3">
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedChat?.buyerId === user?.id ? 'Seller' : 'Buyer'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {socket?.readyState === WebSocket.OPEN ? 'Online' : 'Connecting...'}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-xs">
                              <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : messages?.length > 0 ? (
                      messages.map((message: Message) => {
                        const isOwnMessage = message.senderId === user?.id;
                        return (
                          <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwnMessage 
                                ? 'bg-primary text-white' 
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="text-sm">{message.message}</p>
                              <span className={`text-xs ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {new Date(message.createdAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No messages yet. Start the conversation!</p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || socket?.readyState !== WebSocket.OPEN}
                        className="bg-primary hover:bg-blue-600"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

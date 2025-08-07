import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Send, MessageCircle, Minimize2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatWidgetProps {
  sellerId: string;
  listingId: string;
  onClose: () => void;
}

interface Message {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
}

export default function ChatWidget({ sellerId, listingId, onClose }: ChatWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create or get existing chat
  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/chats', {
        sellerId,
        listingId
      });
      return response.json();
    },
    onSuccess: (data) => {
      setChatId(data.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  });

  // Get chat messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
  });

  // Initialize chat
  useEffect(() => {
    createChatMutation.mutate();
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!chatId || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
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
        
        if (data.type === 'new_message' && data.chatId === chatId) {
          queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
        }
        
        if (data.type === 'message_sent') {
          setNewMessage("");
          queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [chatId, user, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const sendMessage = () => {
    if (!newMessage.trim() || !chatId || !socket) return;

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'chat_message',
        chatId,
        content: newMessage.trim()
      }));
    } else {
      toast({
        title: "Connection Error",
        description: "Unable to send message",
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

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="w-8 h-8 mr-3">
                <AvatarFallback className="bg-white text-primary text-sm">
                  S
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-sm">Seller</div>
                <div className="text-xs opacity-75">
                  {socket?.readyState === WebSocket.OPEN ? 'Online' : 'Connecting...'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-xs">
                        <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages?.length > 0 ? (
                messages.map((message: Message) => {
                  const isOwnMessage = message.senderId === user?.id;
                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        isOwnMessage 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p>{message.message}</p>
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
                    <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Start the conversation!</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 text-sm"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || socket?.readyState !== WebSocket.OPEN}
                  size="sm"
                  className="bg-primary hover:bg-blue-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

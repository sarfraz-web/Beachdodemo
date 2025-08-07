import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['seller', 'buyer']).default('buyer')
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: ''
    }
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      phone: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'buyer' as const
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      onClose();
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      toast({
        title: "Welcome to Beachdo!",
        description: "Your account has been created successfully.",
      });
      onClose();
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' ? 'Sign In to Beachdo' : 'Create Your Account'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="identifier">Email or Phone</Label>
              <Input
                id="identifier"
                {...loginForm.register('identifier')}
                placeholder="Enter your email or phone number"
              />
              {loginForm.formState.errors.identifier && (
                <p className="text-sm text-red-600 mt-1">
                  {loginForm.formState.errors.identifier.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...loginForm.register('password')}
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm">Remember me</Label>
              </div>
              <Button type="button" variant="link" className="text-sm">
                Forgot password?
              </Button>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-blue-600" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <div className="text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <Button 
                type="button" 
                variant="link" 
                className="text-primary hover:text-blue-700 p-0"
                onClick={() => setMode('register')}
              >
                Sign up
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...registerForm.register('firstName')}
                  placeholder="First name"
                />
                {registerForm.formState.errors.firstName && (
                  <p className="text-sm text-red-600 mt-1">
                    {registerForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...registerForm.register('lastName')}
                  placeholder="Last name"
                />
                {registerForm.formState.errors.lastName && (
                  <p className="text-sm text-red-600 mt-1">
                    {registerForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...registerForm.register('email')}
                placeholder="Enter your email"
              />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...registerForm.register('phone')}
                placeholder="+91 XXXXX XXXXX"
              />
              {registerForm.formState.errors.phone && (
                <p className="text-sm text-red-600 mt-1">
                  {registerForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="role">I want to</Label>
              <Select onValueChange={(value) => registerForm.setValue('role', value as 'buyer' | 'seller')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buy products</SelectItem>
                  <SelectItem value="seller">Sell products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="registerPassword">Password</Label>
              <Input
                id="registerPassword"
                type="password"
                {...registerForm.register('password')}
                placeholder="Create a strong password"
              />
              {registerForm.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" required />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <a href="#" className="text-primary hover:text-blue-700">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:text-blue-700">Privacy Policy</a>
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-blue-600" 
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
            </Button>
            
            <div className="text-center">
              <span className="text-gray-600">Already have an account? </span>
              <Button 
                type="button" 
                variant="link" 
                className="text-primary hover:text-blue-700 p-0"
                onClick={() => setMode('login')}
              >
                Sign in
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

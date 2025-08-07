import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const listingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters'),
  price: z.string().min(1, 'Price is required'),
  location: z.string().min(1, 'Location is required'),
  categoryId: z.string().min(1, 'Category is required')
});

interface ProductFormProps {
  onSuccess?: () => void;
  editData?: any;
}

export default function ProductForm({ onSuccess, editData }: ProductFormProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(editData?.images || []);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: editData?.title || '',
      description: editData?.description || '',
      price: editData?.price || '',
      location: editData?.location || '',
      categoryId: editData?.categoryId || ''
    }
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = editData ? `/api/listings/${editData.id}` : '/api/listings';
      const method = editData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: data
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save listing');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: editData ? "Listing updated" : "Listing created",
        description: editData ? "Your listing has been updated successfully" : "Your listing has been created and is pending approval",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedImages.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload maximum 5 images",
        variant: "destructive",
      });
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Each image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed",
          variant: "destructive",
        });
        return;
      }
    });

    setSelectedImages(prev => [...prev, ...files]);
    
    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: z.infer<typeof listingSchema>) => {
    if (!user || user.kycStatus !== 'verified') {
      toast({
        title: "KYC Verification Required",
        description: "You need to complete KYC verification before creating listings",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    selectedImages.forEach((image) => {
      formData.append('images', image);
    });

    createMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editData ? 'Edit Listing' : 'Create New Listing'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Enter listing title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Describe your item"
              rows={4}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                {...form.register('price')}
                placeholder="0"
              />
              {form.formState.errors.price && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...form.register('location')}
                placeholder="City, State"
              />
              {form.formState.errors.location && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.location.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(value) => form.setValue('categoryId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.categoryId && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.categoryId.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="images">Images (Max 5)</Label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-blue-600"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending 
                ? (editData ? 'Updating...' : 'Creating...') 
                : (editData ? 'Update Listing' : 'Create Listing')
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

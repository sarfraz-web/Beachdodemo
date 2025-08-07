import { storage } from '../storage';
import { z } from 'zod';

// KYC Data schema
const kycDataSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Invalid Aadhaar number'),
  name: z.string().min(1, 'Name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(1, 'Address is required'),
  documentUrl: z.string().url('Invalid document URL').optional()
});

export type KycData = z.infer<typeof kycDataSchema>;

export class KycService {
  async submitKycVerification(userId: string, kycData: KycData) {
    // Validate KYC data
    const validatedData = kycDataSchema.parse(kycData);
    
    // In a real implementation, this would integrate with DigiLocker API
    // For MVP, we'll simulate the verification process
    const isValid = await this.simulateDigiLockerVerification(validatedData);
    
    if (isValid) {
      // Update user KYC status to verified
      await storage.updateUser(userId, {
        kycStatus: 'verified',
        kycData: validatedData
      });
      
      return { status: 'verified', message: 'KYC verification successful' };
    } else {
      // Update user KYC status to rejected
      await storage.updateUser(userId, {
        kycStatus: 'rejected',
        kycData: validatedData
      });
      
      return { status: 'rejected', message: 'KYC verification failed' };
    }
  }
  
  async getKycStatus(userId: string) {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      status: user.kycStatus,
      data: user.kycData
    };
  }
  
  private async simulateDigiLockerVerification(kycData: KycData): Promise<boolean> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For MVP, we'll approve all valid submissions
    // In production, this would make actual API calls to DigiLocker
    return true;
  }
  
  async approveKycManually(userId: string, adminId: string) {
    const admin = await storage.getUser(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    
    await storage.updateUser(userId, {
      kycStatus: 'verified'
    });
    
    return { status: 'verified', message: 'KYC approved by admin' };
  }
  
  async rejectKycManually(userId: string, adminId: string, reason: string) {
    const admin = await storage.getUser(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    
    await storage.updateUser(userId, {
      kycStatus: 'rejected'
    });
    
    return { status: 'rejected', message: reason };
  }
}

export const kycService = new KycService();

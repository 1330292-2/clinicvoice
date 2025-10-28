import { Router } from 'express';
import speakeasy from 'speakeasy';
import { db } from '../db';
import { totpSecrets, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { EncryptionService } from '../middleware/security';
import crypto from 'crypto';

const router = Router();

// Generate 2FA secret and QR code
router.post('/setup', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if 2FA already enabled
    const [existing] = await db.select()
      .from(totpSecrets)
      .where(and(
        eq(totpSecrets.userId, userId),
        eq(totpSecrets.enabled, true)
      ));
    
    if (existing) {
      return res.status(400).json({ message: '2FA already enabled' });
    }

    // Generate new TOTP secret
    const secret = speakeasy.generateSecret({
      name: `ClinicVoice (${user.email})`,
      issuer: 'ClinicVoice',
      length: 32
    });

    // Generate backup codes (10 codes)
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Encrypt the secret and backup codes before storing
    const encryptedSecret = EncryptionService.encrypt(secret.base32);
    const encryptedBackupCodes = backupCodes.map(code => 
      EncryptionService.encrypt(code)
    );

    // Store in database (not enabled until verified)
    const [totpRecord] = await db.insert(totpSecrets)
      .values({
        userId,
        secret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        enabled: false
      })
      .onConflictDoUpdate({
        target: totpSecrets.userId,
        set: {
          secret: encryptedSecret,
          backupCodes: encryptedBackupCodes,
          enabled: false
        }
      })
      .returning();

    res.json({
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url,
      backupCodes: backupCodes
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ message: 'Failed to setup 2FA' });
  }
});

// Verify and enable 2FA
router.post('/verify', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Token required' });
    }

    // Get the unverified TOTP record
    const [totpRecord] = await db.select()
      .from(totpSecrets)
      .where(eq(totpSecrets.userId, userId));

    if (!totpRecord) {
      return res.status(404).json({ message: '2FA not setup. Please setup first.' });
    }

    // Decrypt the secret
    const secret = EncryptionService.decrypt(totpRecord.secret);

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 60 seconds before/after current time
    });

    if (!verified) {
      return res.status(401).json({ message: 'Invalid verification code' });
    }

    // Enable 2FA
    await db.update(totpSecrets)
      .set({ 
        enabled: true,
        verifiedAt: new Date()
      })
      .where(eq(totpSecrets.id, totpRecord.id));

    res.json({ 
      success: true,
      message: '2FA enabled successfully' 
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({ message: 'Failed to verify 2FA' });
  }
});

// Verify 2FA token during login
router.post('/authenticate', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { token, backupCode } = req.body;

    if (!token && !backupCode) {
      return res.status(400).json({ message: 'Token or backup code required' });
    }

    const [totpRecord] = await db.select()
      .from(totpSecrets)
      .where(and(
        eq(totpSecrets.userId, userId),
        eq(totpSecrets.enabled, true)
      ));

    if (!totpRecord) {
      return res.status(403).json({ message: '2FA not enabled' });
    }

    const secret = EncryptionService.decrypt(totpRecord.secret);

    // Try TOTP token first
    if (token) {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (verified) {
        // Mark session as 2FA verified
        (req.session as any).twoFactorVerified = true;
        (req.session as any).twoFactorVerifiedAt = new Date();
        
        return res.json({ 
          success: true,
          message: '2FA verified successfully' 
        });
      }
    }

    // Try backup code if token failed
    if (backupCode && totpRecord.backupCodes) {
      const codes = totpRecord.backupCodes as string[];
      let codeMatched = false;
      const updatedCodes = codes.filter(encryptedCode => {
        const decryptedCode = EncryptionService.decrypt(encryptedCode);
        if (decryptedCode === backupCode.toUpperCase()) {
          codeMatched = true;
          return false; // Remove this code (used)
        }
        return true;
      });

      if (codeMatched) {
        // Update backup codes (remove used one)
        await db.update(totpSecrets)
          .set({ backupCodes: updatedCodes })
          .where(eq(totpSecrets.id, totpRecord.id));

        // Mark session as 2FA verified
        (req.session as any).twoFactorVerified = true;
        (req.session as any).twoFactorVerifiedAt = new Date();
        
        return res.json({ 
          success: true,
          message: '2FA verified with backup code' 
        });
      }
    }

    res.status(401).json({ message: 'Invalid 2FA code' });
  } catch (error) {
    console.error('Error authenticating 2FA:', error);
    res.status(500).json({ message: 'Failed to authenticate 2FA' });
  }
});

// Disable 2FA (requires current 2FA token for security)
router.post('/disable', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Current 2FA token required' });
    }

    const [totpRecord] = await db.select()
      .from(totpSecrets)
      .where(and(
        eq(totpSecrets.userId, userId),
        eq(totpSecrets.enabled, true)
      ));

    if (!totpRecord) {
      return res.status(404).json({ message: '2FA not enabled' });
    }

    const secret = EncryptionService.decrypt(totpRecord.secret);

    // Verify the token before disabling
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ message: 'Invalid 2FA token' });
    }

    // Disable 2FA
    await db.delete(totpSecrets)
      .where(eq(totpSecrets.id, totpRecord.id));

    res.json({ 
      success: true,
      message: '2FA disabled successfully' 
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
});

// Check 2FA status
router.get('/status', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;

    const [totpRecord] = await db.select()
      .from(totpSecrets)
      .where(and(
        eq(totpSecrets.userId, userId),
        eq(totpSecrets.enabled, true)
      ));

    res.json({
      enabled: !!totpRecord,
      required: false, // Can be made mandatory later
      sessionVerified: !!(req.session as any)?.twoFactorVerified
    });
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    res.status(500).json({ message: 'Failed to check 2FA status' });
  }
});

export default router;

import { User, IUser } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { WorkspaceInvitation } from '../models/WorkspaceInvitation';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  JwtUserPayload
} from '../utils/tokens';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '../validations/auth.validation';

/**
 * Auth Service
 * 
 * Encapsulates all business logic for registration, authentication, token issuance,
 * token rotation, and session invalidation.
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
  tokens: AuthTokens;
}

export class AuthService {
  /**
   * Register a new user account (Option B: User-only)
   */
  public async register(input: RegisterInput): Promise<AuthResult> {
    // 1. Verify email uniqueness
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    // 2. Hash password with bcrypt
    const hashedPassword = await hashPassword(input.password);

    // 3. Create user record
    const user = await User.create({
      name: input.name,
      email: input.email,
      password: hashedPassword
    });

    // 3b. Automatically enroll in any workspaces where this email was invited
    try {
      const pendingInvites = await WorkspaceInvitation.find({
        email: user.email.toLowerCase(),
        status: 'pending'
      });
      for (const invite of pendingInvites) {
        const alreadyMember = await WorkspaceMember.findOne({
          workspaceId: invite.workspaceId,
          userId: user._id
        });
        if (!alreadyMember) {
          await WorkspaceMember.create({
            workspaceId: invite.workspaceId,
            userId: user._id,
            role: invite.role
          });
        }
        invite.status = 'accepted';
        await invite.save();
      }
    } catch {
      // Non-blocking for registration flow
    }

    // 4. Issue tokens & persist refresh token
    const tokens = await this.issueTokens(user);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      tokens
    };
  }

  /**
   * Authenticate user credentials
   */
  public async login(input: LoginInput): Promise<AuthResult> {
    // 1. Find user by email (explicitly selecting password)
    const user = await User.findOne({ email: input.email }).select('+password');
    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 2. Compare password hash
    const isValid = await comparePassword(input.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 3. Issue new tokens
    const tokens = await this.issueTokens(user);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      tokens
    };
  }

  /**
   * Rotate/Refresh Access Token using a valid Refresh Token
   */
  public async refreshToken(rawToken: string): Promise<AuthTokens> {
    // 1. Verify JWT signature & expiration
    let decoded: JwtUserPayload;
    try {
      decoded = verifyRefreshToken(rawToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // 2. Hash token and check if it exists in database
    const tokenHash = hashToken(rawToken);
    const stored = await RefreshToken.findOne({ tokenHash, userId: decoded.userId });
    if (!stored) {
      throw new UnauthorizedError('Refresh token has been revoked or expired');
    }

    // 3. Delete old refresh token (Token Rotation for security)
    await RefreshToken.deleteOne({ _id: stored._id });

    // 4. Find user to ensure account is still active
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    // 5. Issue new token pair
    return this.issueTokens(user);
  }

  /**
   * Revoke refresh token on logout
   */
  public async logout(rawToken?: string, userId?: string): Promise<void> {
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await RefreshToken.deleteOne({ tokenHash });
    } else if (userId) {
      // Revoke all tokens for user if no token provided
      await RefreshToken.deleteMany({ userId });
    }
  }

  /**
   * Retrieve current authenticated user profile
   */
  public async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return user.toJSON();
  }

  /**
   * Update profile details (name)
   */
  public async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    user.name = input.name;
    await user.save();
    return user.toJSON();
  }

  /**
   * Change account password
   */
  public async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await User.findById(userId).select('+password');
    if (!user || !user.password) {
      throw new NotFoundError('User profile not found');
    }

    const isMatch = await comparePassword(input.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    user.password = await hashPassword(input.newPassword);
    await user.save();

    // Invalidate existing refresh tokens for security
    await RefreshToken.deleteMany({ userId: user._id });

    return { message: 'Password updated successfully' };
  }

  /**
   * Helper: Generate token pair and persist hashed refresh token to MongoDB
   */
  private async issueTokens(user: IUser): Promise<AuthTokens> {
    const payload: JwtUserPayload = {
      userId: user._id.toString(),
      email: user.email
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Compute expiration date for refresh token (7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Store hashed token in DB
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();

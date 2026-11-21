import { Types } from 'mongoose';
import { Workspace, IWorkspace } from '../models/Workspace';
import { WorkspaceMember, IWorkspaceMember, WorkspaceRole } from '../models/WorkspaceMember';
import { WorkspaceInvitation, IWorkspaceInvitation } from '../models/WorkspaceInvitation';
import { User } from '../models/User';
import { generateUniqueWorkspaceSlug } from '../utils/slug';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  AddMemberInput,
  UpdateMemberRoleInput
} from '../validations/workspace.validation';

/**
 * Workspace Service
 * 
 * Encapsulates all multi-tenant operations:
 * - Creating workspaces and establishing initial owner membership.
 * - Retrieving user's joined workspaces.
 * - Enforcing workspace ownership rules (deletion, transfers).
 * - Member management (invitations, role updates, departures).
 */
export class WorkspaceService {
  /**
   * Create a new workspace
   * Creator is automatically enrolled as the 'owner' in WorkspaceMember.
   */
  public async createWorkspace(userId: string, input: CreateWorkspaceInput): Promise<IWorkspace> {
    // 1. Determine slug (custom or auto-generated)
    let slug: string;
    if (input.slug) {
      const existing = await Workspace.findOne({ slug: input.slug });
      if (existing) {
        throw new ConflictError('A workspace with this slug already exists');
      }
      slug = input.slug;
    } else {
      slug = await generateUniqueWorkspaceSlug(input.name);
    }

    // 2. Create workspace document
    const workspace = await Workspace.create({
      name: input.name,
      slug,
      key: input.key,
      ownerId: new Types.ObjectId(userId)
    });

    // 3. Create initial membership record with 'owner' role
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: new Types.ObjectId(userId),
      role: 'owner'
    });

    return workspace;
  }

  /**
   * Get all workspaces the user is a member of (along with their role)
   */
  public async getUserWorkspaces(userId: string) {
    const memberships = await WorkspaceMember.find({
      userId: new Types.ObjectId(userId)
    }).populate<{ workspaceId: IWorkspace }>('workspaceId');

    return memberships
      .filter((m) => m.workspaceId !== null)
      .map((m) => ({
        id: m.workspaceId._id,
        name: m.workspaceId.name,
        slug: m.workspaceId.slug,
        key: m.workspaceId.key,
        role: m.role,
        joinedAt: m.joinedAt,
        createdAt: m.workspaceId.createdAt
      }));
  }

  /**
   * Get workspace details by ID
   */
  public async getWorkspaceById(workspace: IWorkspace, membership: IWorkspaceMember) {
    return {
      ...workspace.toJSON(),
      currentUserRole: membership.role
    };
  }

  /**
   * Update workspace details (name, slug, key)
   */
  public async updateWorkspace(workspace: IWorkspace, input: UpdateWorkspaceInput): Promise<IWorkspace> {
    if (input.name) {
      workspace.name = input.name;
    }
    if (input.key) {
      workspace.key = input.key;
    }
    if (input.slug && input.slug !== workspace.slug) {
      const existing = await Workspace.findOne({ slug: input.slug, _id: { $ne: workspace._id } });
      if (existing) {
        throw new ConflictError('A workspace with this slug already exists');
      }
      workspace.slug = input.slug;
    }

    await workspace.save();
    return workspace;
  }

  /**
   * Delete workspace (owner only)
   * Cascades deletion of all workspace memberships and invitations.
   */
  public async deleteWorkspace(workspace: IWorkspace): Promise<void> {
    await WorkspaceMember.deleteMany({ workspaceId: workspace._id });
    await WorkspaceInvitation.deleteMany({ workspaceId: workspace._id });
    await Workspace.deleteOne({ _id: workspace._id });
  }

  /**
   * List all members of a workspace
   */
  public async getWorkspaceMembers(workspaceId: Types.ObjectId) {
    const members = await WorkspaceMember.find({ workspaceId })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 });

    return members
      .filter((m: any) => m.userId !== null)
      .map((m: any) => ({
        membershipId: m._id,
        user: {
          id: m.userId._id,
          name: m.userId.name,
          email: m.userId.email
        },
        role: m.role,
        joinedAt: m.joinedAt
      }));
  }

  /**
   * Add a member or create a pending invitation
   */
  public async addWorkspaceMember(
    workspaceId: Types.ObjectId,
    currentUserId: string,
    input: AddMemberInput
  ) {
    // 1. Locate user by email
    const targetUser = await User.findOne({ email: input.email });

    if (targetUser) {
      // Check for duplicate membership
      const existing = await WorkspaceMember.findOne({
        workspaceId,
        userId: targetUser._id
      });

      if (existing) {
        throw new ConflictError('This user is already a member of the workspace');
      }

      // Create membership directly
      const member = await WorkspaceMember.create({
        workspaceId,
        userId: targetUser._id,
        role: input.role
      });

      // Clear any pending invitations for this email in this workspace
      await WorkspaceInvitation.updateMany(
        { workspaceId, email: input.email, status: 'pending' },
        { status: 'accepted' }
      );

      return {
        membershipId: member._id,
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email
        },
        role: member.role,
        joinedAt: member.joinedAt,
        status: 'active'
      };
    } else {
      // Target user has not registered yet: create or update a pending invitation
      const existingInvite = await WorkspaceInvitation.findOne({
        workspaceId,
        email: input.email,
        status: 'pending'
      });

      if (existingInvite) {
        throw new ConflictError('An invitation is already pending for this email address');
      }

      const invite = await WorkspaceInvitation.create({
        workspaceId,
        email: input.email,
        role: input.role,
        invitedBy: new Types.ObjectId(currentUserId),
        status: 'pending'
      });

      return {
        invitationId: invite._id,
        email: invite.email,
        role: invite.role,
        status: 'pending',
        createdAt: invite.createdAt
      };
    }
  }

  /**
   * List pending invitations for a workspace (owner or admin only)
   */
  public async getWorkspaceInvitations(workspaceId: Types.ObjectId) {
    const invites = await WorkspaceInvitation.find({
      workspaceId,
      status: 'pending'
    }).populate('invitedBy', 'name email').sort({ createdAt: -1 });

    return invites.map((inv: any) => ({
      id: inv._id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      createdAt: inv.createdAt,
      invitedBy: inv.invitedBy ? {
        id: inv.invitedBy._id,
        name: inv.invitedBy.name,
        email: inv.invitedBy.email
      } : null
    }));
  }

  /**
   * Cancel/revoke a pending invitation
   */
  public async cancelWorkspaceInvitation(workspaceId: Types.ObjectId, invitationId: string): Promise<void> {
    if (!Types.ObjectId.isValid(invitationId)) {
      throw new ValidationError('Invalid invitation ID format');
    }

    const invitation = await WorkspaceInvitation.findOne({
      _id: new Types.ObjectId(invitationId),
      workspaceId,
      status: 'pending'
    });

    if (!invitation) {
      throw new NotFoundError('Pending invitation not found');
    }

    await WorkspaceInvitation.deleteOne({ _id: invitation._id });
  }

  /**
   * Get all pending invitations for a specific user (by their email)
   */
  public async getUserInvitations(userEmail: string) {
    const invites = await WorkspaceInvitation.find({
      email: userEmail.toLowerCase(),
      status: 'pending'
    }).populate<{ workspaceId: IWorkspace }>('workspaceId').populate('invitedBy', 'name email');

    return invites
      .filter((inv) => inv.workspaceId !== null)
      .map((inv: any) => ({
        id: inv._id,
        workspace: {
          id: inv.workspaceId._id,
          name: inv.workspaceId.name,
          slug: inv.workspaceId.slug
        },
        role: inv.role,
        createdAt: inv.createdAt,
        invitedBy: inv.invitedBy ? {
          name: inv.invitedBy.name,
          email: inv.invitedBy.email
        } : null
      }));
  }

  /**
   * Accept an invitation
   */
  public async acceptInvitation(userId: string, userEmail: string, invitationId: string) {
    if (!Types.ObjectId.isValid(invitationId)) {
      throw new ValidationError('Invalid invitation ID format');
    }

    const invitation = await WorkspaceInvitation.findOne({
      _id: new Types.ObjectId(invitationId),
      email: userEmail.toLowerCase(),
      status: 'pending'
    });

    if (!invitation) {
      throw new NotFoundError('Pending invitation not found');
    }

    // Verify if already a member
    const existing = await WorkspaceMember.findOne({
      workspaceId: invitation.workspaceId,
      userId: new Types.ObjectId(userId)
    });

    if (!existing) {
      await WorkspaceMember.create({
        workspaceId: invitation.workspaceId,
        userId: new Types.ObjectId(userId),
        role: invitation.role
      });
    }

    invitation.status = 'accepted';
    await invitation.save();

    return { message: 'Invitation accepted successfully' };
  }

  /**
   * Decline an invitation
   */
  public async declineInvitation(userEmail: string, invitationId: string) {
    if (!Types.ObjectId.isValid(invitationId)) {
      throw new ValidationError('Invalid invitation ID format');
    }

    const invitation = await WorkspaceInvitation.findOne({
      _id: new Types.ObjectId(invitationId),
      email: userEmail.toLowerCase(),
      status: 'pending'
    });

    if (!invitation) {
      throw new NotFoundError('Pending invitation not found');
    }

    invitation.status = 'declined';
    await invitation.save();

    return { message: 'Invitation declined' };
  }

  /**
   * Update a member's role (admin or owner only)
   */
  public async updateMemberRole(
    workspace: IWorkspace,
    memberId: string,
    currentUserId: string,
    currentUserRole: WorkspaceRole,
    input: UpdateMemberRoleInput
  ) {
    if (!Types.ObjectId.isValid(memberId)) {
      throw new ValidationError('Invalid member ID format');
    }

    const member = await WorkspaceMember.findById(memberId);
    if (!member || !member.workspaceId.equals(workspace._id)) {
      throw new NotFoundError('Workspace member not found');
    }

    // Security guardrail: Cannot alter the owner's role
    if (member.role === 'owner') {
      throw new ForbiddenError('The workspace owner role cannot be modified');
    }

    // Security guardrail: Cannot promote anyone to 'owner' via standard role update
    if (input.role === ('owner' as any)) {
      throw new ForbiddenError('Cannot assign owner role via role update; use ownership transfer instead');
    }

    // Security guardrail: Admins cannot modify other admins' roles (only owner can modify admins)
    if (currentUserRole === 'admin' && member.role === 'admin') {
      throw new ForbiddenError('Admins cannot modify the role of another admin');
    }

    member.role = input.role;
    await member.save();

    return member.toJSON();
  }

  /**
   * Remove a member or leave the workspace
   */
  public async removeWorkspaceMember(
    workspace: IWorkspace,
    memberId: string,
    currentUserId: string,
    currentUserRole: WorkspaceRole
  ): Promise<void> {
    if (!Types.ObjectId.isValid(memberId)) {
      throw new ValidationError('Invalid member ID format');
    }

    const member = await WorkspaceMember.findById(memberId);
    if (!member || !member.workspaceId.equals(workspace._id)) {
      throw new NotFoundError('Workspace member not found');
    }

    const isSelf = member.userId.toString() === currentUserId;

    // Security guardrail: Owner cannot leave without transferring ownership
    if (isSelf && member.role === 'owner') {
      throw new ForbiddenError('As the owner, you cannot leave the workspace. You must transfer ownership or delete the workspace.');
    }

    // Security guardrail: Admins cannot kick other admins or the owner
    if (!isSelf && currentUserRole === 'admin' && (member.role === 'admin' || member.role === 'owner')) {
      throw new ForbiddenError('Admins cannot remove other admins or the workspace owner');
    }

    // Security guardrail: Members/Viewers cannot remove others
    if (!isSelf && currentUserRole !== 'owner' && currentUserRole !== 'admin') {
      throw new ForbiddenError('You do not have permission to remove members from this workspace');
    }

    await WorkspaceMember.deleteOne({ _id: member._id });
  }
}

export const workspaceService = new WorkspaceService();

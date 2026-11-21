import { JwtUserPayload } from '../utils/tokens';
import { IWorkspace } from '../models/Workspace';
import { IWorkspaceMember } from '../models/WorkspaceMember';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      workspace?: IWorkspace;
      membership?: IWorkspaceMember;
    }
  }
}

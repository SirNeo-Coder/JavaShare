// Every /api request is handled by the shared CodeShare routes (backend/src/routes.ts):
// offline on the teacher's laptop (next start) and online on Cloudflare.
import { handleApi } from "../../../backend/src/routes";

export const dynamic = "force-dynamic";

const handle = (request: Request) => handleApi(request);
export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };

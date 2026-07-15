export const dynamic = 'force-dynamic';

import { testLogin } from '@/server/controller/auth.controller';
import { compose } from '@/server/middleware/compose';
import { withError } from '@/server/middleware/withError';

export const POST = compose(withError)(testLogin);

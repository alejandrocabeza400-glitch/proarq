import { app } from './app';
import { env } from './infra/config/env';

app.listen(env.PORT, () => console.log(`🚀 API running on http://localhost:${env.PORT}`));

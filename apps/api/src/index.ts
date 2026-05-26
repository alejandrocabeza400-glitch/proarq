import { app } from './app';
import { env } from './infra/config/env';

app.listen(env.PORT, () => {
  console.log(`🚀 API Server ready at http://localhost:${env.PORT}`);
});
